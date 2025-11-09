import { generateUuid } from '@better-claude-code/node-utils';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import type { SSEStreamingApi } from 'hono/streaming';
import { homedir } from 'os';
import { join } from 'path';
import { parseSessionMessages } from '@better-claude-code/node-utils';
import { sessionManager } from '../session-manager.js';
import { type LiveSessionEvent, SessionStatus } from '../types.js';

function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', homedir());
  }
  if (path === '~') {
    return homedir();
  }
  return path;
}

export async function startStream(
  sessionId: string,
  _message: string,
  projectPath: string,
  stream: SSEStreamingApi,
  _isFirstMessage = true,
  _resumeSessionId?: string
): Promise<void> {
  console.log(`[start-stream] Starting stream for sessionId: ${sessionId}, projectPath: ${projectPath}`);

  let session = sessionManager.getSession(sessionId);

  if (!session && sessionId !== 'new') {
    try {
      console.log(`[start-stream] Session ${sessionId} not in memory, creating/restoring`);
      sessionManager.createSession(projectPath, sessionId);
      session = sessionManager.getSession(sessionId);

      if (!session) {
        console.error(`[start-stream] Failed to create session ${sessionId}`);
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            message: 'Failed to create session - please refresh and try again'
          } satisfies LiveSessionEvent),
          event: 'error'
        });
        return;
      }
    } catch (err) {
      console.error(`[start-stream] Error creating session ${sessionId}:`, err);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          message: `Failed to create session: ${err instanceof Error ? err.message : 'Unknown error'}`
        } satisfies LiveSessionEvent),
        event: 'error'
      });
      return;
    }
  }

  if (sessionId === 'new') {
    console.log('[start-stream] New session, will wait for first message and init event from Claude');
  }

  if (session?.process && !session.process.killed) {
    console.log(`[start-stream] Session ${sessionId} already has active process, reusing connection`);
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'error',
        message: 'Session already has an active Claude process. Close existing stream first.'
      } satisfies LiveSessionEvent),
      event: 'error'
    });
    return;
  }

  if (session) {
    sessionManager.updateStatus(sessionId, SessionStatus.IDLE);
  }

  await stream.writeSSE({
    data: JSON.stringify({ type: 'status-change', status: SessionStatus.IDLE } satisfies LiveSessionEvent),
    event: 'status'
  });

  const expandedProjectPath = session ? expandPath(session.projectPath) : expandPath(projectPath);

  if (!existsSync(expandedProjectPath)) {
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'error',
        message: `Project path does not exist: ${expandedProjectPath}`
      } satisfies LiveSessionEvent),
      event: 'error'
    });
    sessionManager.updateStatus(sessionId, SessionStatus.ERROR);
    return;
  }

  const claudeCliPath =
    process.env.CLAUDE_CLI_PATH || '/home/lucas/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js';

  if (!existsSync(claudeCliPath)) {
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'error',
        message: `Claude CLI not found at: ${claudeCliPath}. Please check installation.`
      } satisfies LiveSessionEvent),
      event: 'error'
    });
    sessionManager.updateStatus(sessionId, SessionStatus.ERROR);
    return;
  }

  const args = ['--print', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose'];

  const projectPathNormalized = expandedProjectPath.replace(/\//g, '-').replace(/_/g, '-');
  const claudeSessionPath = join(homedir(), '.claude', 'projects', projectPathNormalized, `${sessionId}.jsonl`);
  const sessionFileExists = existsSync(claudeSessionPath);

  const shouldResume = sessionId !== 'new' && session && sessionFileExists;
  const historyMessages: any[] = [];

  if (shouldResume) {
    console.log(`[Claude CLI] Resuming Claude session: ${sessionId} from ${claudeSessionPath}`);
    args.push('--resume', sessionId);

    try {
      const fileContent = readFileSync(claudeSessionPath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      console.log(`[Claude CLI] Found ${lines.length} lines in session file`);

      const events = lines.map((line) => JSON.parse(line));
      const { messages } = parseSessionMessages(events, {
        groupMessages: true,
        includeImages: false
      });

      for (const msg of messages) {
        historyMessages.push({
          id: msg.id,
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        });
      }

      console.log(`[Claude CLI] Loaded ${historyMessages.length} messages from session file`);

      if (historyMessages.length > 0) {
        console.log(`[Claude CLI] Replacing session messages with ${historyMessages.length} messages from JSONL`);
        const currentSession = sessionManager.getSession(sessionId);
        if (currentSession) {
          currentSession.messages = [];
        }
        for (const msg of historyMessages) {
          sessionManager.addMessage(sessionId, {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          });
        }
      }
    } catch (e) {
      console.error('[Claude CLI] Failed to read session file:', e);
    }
  } else {
    console.log('[Claude CLI] Starting new Claude session');
  }

  console.log('[Claude CLI] Spawning:', {
    node: process.execPath,
    cli: claudeCliPath,
    args,
    cwd: expandedProjectPath
  });

  let claude: ReturnType<typeof spawn>;
  try {
    claude = spawn(process.execPath, [claudeCliPath, ...args], {
      cwd: expandedProjectPath,
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('[Claude CLI] Process spawned, PID:', claude.pid);

    if (!claude.stdout || !claude.stderr || !claude.stdin) {
      throw new Error('Failed to setup stdio pipes');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to spawn Claude CLI';
    console.error('[Claude CLI] Spawn error:', err);
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'error',
        message: `Claude CLI not found. Please ensure 'claude' is installed and in your PATH. ${errorMessage}`
      } satisfies LiveSessionEvent),
      event: 'error'
    });
    sessionManager.updateStatus(sessionId, SessionStatus.ERROR);
    return;
  }

  claude.on('error', async (err) => {
    console.error('[Claude CLI] Process error:', err);
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'error',
        message: `Claude CLI error: ${err.message}. Please ensure 'claude' is installed and in your PATH.`
      } satisfies LiveSessionEvent),
      event: 'error'
    });
    sessionManager.updateStatus(sessionId, SessionStatus.ERROR);
  });

  console.log('[Claude CLI] Setting up event listeners...');

  let buffer = '';
  let actualSessionId: string = sessionId;
  let sessionCreated = false;
  let messagesSentToStdin = false;

  const statusChangeHandler = async ({ sessionId: sid, status }: { sessionId: string; status: SessionStatus }) => {
    if (sid === actualSessionId) {
      console.log('[Claude CLI] Status changed via sessionManager:', status);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'status-change',
          status
        } satisfies LiveSessionEvent),
        event: 'status'
      });
    }
  };

  sessionManager.on('statusChange', statusChangeHandler);

  if (session) {
    const messages = sessionManager.getMessages(sessionId);
    sessionManager.setProcess(sessionId, claude);

    if (messages.length > 0) {
      console.log(`[Claude CLI] Sending ${messages.length} messages to frontend as history`);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'history',
          messages
        } satisfies LiveSessionEvent),
        event: 'history'
      });
    }

    if (shouldResume) {
      console.log(`[Claude CLI] Using --resume flag with ${messages.length} messages`);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'session-init',
          sessionId: sessionId,
          tools: [],
          model: 'claude-sonnet-4-5-20250929'
        } satisfies LiveSessionEvent),
        event: 'init'
      });
    } else if (messages.length > 0) {
      console.log(`[Claude CLI] Temp session with ${messages.length} messages, sending to stdin to trigger init`);
      for (const msg of messages) {
        if (msg.role === 'user') {
          const userMessage = `${JSON.stringify({
            type: 'user',
            message: {
              role: 'user',
              content: [{ type: 'text', text: msg.content }]
            }
          })}\n`;
          claude.stdin.write(userMessage);
          sessionManager.updateStatus(sessionId, SessionStatus.STREAMING);
          messagesSentToStdin = true;
          console.log(`[Claude CLI] Sent temp session message: ${msg.content.substring(0, 50)}...`);
        }
      }
    }
  } else if (sessionId === 'new') {
    console.log('[start-stream] Waiting for first message via POST, then init event will create session');
  }

  claude.stdout.setEncoding('utf8');
  claude.stdout.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);
        console.log('[Claude CLI] Event:', event.type, event.subtype || '');

        if (event.type === 'system' && event.subtype === 'init') {
          const claudeSessionId = event.session_id;
          console.log('[Claude CLI] Init event received, Claude session:', claudeSessionId);

          if (sessionId !== claudeSessionId && claudeSessionId && !sessionCreated) {
            console.log(`[start-stream] Migrating temp session ${sessionId} to Claude session ${claudeSessionId}`);

            const tempSession = sessionManager.getSession(sessionId);
            const queuedMessages = tempSession ? sessionManager.getMessages(sessionId) : [];

            sessionManager.createSession(projectPath, claudeSessionId);
            actualSessionId = claudeSessionId;
            sessionManager.setProcess(claudeSessionId, claude);

            if (queuedMessages.length > 0) {
              console.log(`[start-stream] Migrating ${queuedMessages.length} messages to new session`);
              for (const msg of queuedMessages) {
                sessionManager.addMessage(claudeSessionId, {
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp
                });
              }
            }

            if (tempSession) {
              console.log(`[start-stream] Clearing temp session process reference before deletion`);
              sessionManager.setProcess(sessionId, null as any);
              console.log(`[start-stream] Deleting temp session ${sessionId}`);
              sessionManager.deleteSession(sessionId);
            }

            sessionCreated = true;

            if (queuedMessages.length > 0 && !messagesSentToStdin) {
              console.log(`[start-stream] Sending ${queuedMessages.length} queued messages to Claude stdin`);
              for (const msg of queuedMessages) {
                if (msg.role === 'user') {
                  const userMessage = `${JSON.stringify({
                    type: 'user',
                    message: {
                      role: 'user',
                      content: [{ type: 'text', text: msg.content }]
                    }
                  })}\n`;
                  claude.stdin?.write(userMessage);
                  sessionManager.updateStatus(claudeSessionId, SessionStatus.STREAMING);
                  console.log(`[start-stream] Sent queued message: ${msg.content.substring(0, 50)}...`);
                }
              }
            } else if (messagesSentToStdin) {
              console.log(`[start-stream] Messages already sent to stdin before init, skipping resend`);
            }
          }

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'session-init',
              sessionId: claudeSessionId || actualSessionId,
              tools: event.tools || [],
              model: event.model || 'unknown'
            } satisfies LiveSessionEvent),
            event: 'init'
          });
        } else if (event.type === 'user' && event.isReplay) {
          console.log('[Claude CLI] User message replayed');
        } else if (event.type === 'assistant') {
          let assistantContent = '';
          const messageId = event.uuid || generateUuid();
          const content = event.message?.content || [];
          for (const block of content) {
            if (block.type === 'text') {
              assistantContent += block.text;
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'text-chunk',
                  content: block.text,
                  role: 'assistant'
                } satisfies LiveSessionEvent),
                event: 'message'
              });
            } else if (block.type === 'tool_use') {
              await stream.writeSSE({
                data: JSON.stringify({
                  type: 'tool-call',
                  toolName: block.name,
                  args: block.input || {}
                } satisfies LiveSessionEvent),
                event: 'tool'
              });
            }
          }

          if (assistantContent) {
            sessionManager.addMessage(actualSessionId, { id: messageId, role: 'assistant', content: assistantContent });
          }
        } else if (event.type === 'result') {
          console.log('[Claude CLI] Turn completed:', {
            cost: event.total_cost_usd,
            tokens: event.usage,
            duration: event.duration_ms
          });

          sessionManager.updateStatus(actualSessionId, SessionStatus.IDLE);
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'status-change',
              status: SessionStatus.IDLE
            } satisfies LiveSessionEvent),
            event: 'status'
          });
        }
      } catch (e) {
        console.error('Failed to parse Claude output:', line, e);
      }
    }
  });

  claude.stderr.on('data', async (data) => {
    const errorMessage = data.toString();
    console.error('[Claude CLI] stderr:', errorMessage);

    await stream.writeSSE({
      data: JSON.stringify({
        type: 'error',
        message: errorMessage
      } satisfies LiveSessionEvent),
      event: 'error'
    });
  });

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      sessionManager.off('statusChange', statusChangeHandler);
      console.log('[Claude CLI] Cleaned up status change listener');
    };

    claude.on('close', async (code, signal) => {
      console.log(`[Claude CLI] Process closed with code ${code}, signal ${signal}`);

      const status = code === 0 ? SessionStatus.COMPLETED : SessionStatus.ERROR;
      sessionManager.updateStatus(actualSessionId, status);

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'complete',
          sessionId: actualSessionId
        } satisfies LiveSessionEvent),
        event: 'complete'
      });

      cleanup();
      resolve();
    });

    claude.on('exit', async (code) => {
      console.log(`[Claude CLI] Process exited with code ${code}`);

      const status = code === 0 ? SessionStatus.COMPLETED : SessionStatus.ERROR;
      sessionManager.updateStatus(actualSessionId, status);

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'complete',
          sessionId: actualSessionId
        } satisfies LiveSessionEvent),
        event: 'complete'
      });

      cleanup();
      resolve();
    });

    stream.onAbort(() => {
      console.log('[Claude CLI] Client disconnected from stream');
      if (claude && !claude.killed) {
        console.log('[Claude CLI] Killing process due to client disconnect');
        claude.kill('SIGTERM');
      }
      cleanup();
      resolve();
    });

    console.log('[Claude CLI] All event listeners registered');
    console.log('[Claude CLI] Stream ready, waiting for messages via POST /messages endpoint');
  });
}
