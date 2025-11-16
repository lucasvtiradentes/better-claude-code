import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLAUDE_CODE_SESSION_COMPACTION_ID, ClaudeHelper, MessageSource } from './claude-helper.js';
import { generateUuid } from './uuid.js';

interface MessageBlock {
  type: MessageSource;
  content: string;
}

export async function parseSessionToMarkdown(sessionFile: string, outputFile: string, repoRoot: string): Promise<void> {
  const content = readFileSync(sessionFile, 'utf-8');
  const lines = content.trim().split('\n');

  const messages: MessageBlock[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (ClaudeHelper.isUserMessage(parsed.type) || ClaudeHelper.isCCMessage(parsed.type)) {
        const messageContent = parsed.message?.content;

        if (!messageContent) continue;

        if (ClaudeHelper.isUserMessage(parsed.type)) {
          if (typeof messageContent === 'string') {
            if (messageContent === 'Warmup' || messageContent.includes('Caveat: The messages below were generated')) {
              continue;
            }
            messages.push({ type: MessageSource.USER, content: messageContent });
          } else if (Array.isArray(messageContent)) {
            const hasToolResult = messageContent.some((item) => item.type === 'tool_result');
            if (!hasToolResult) {
              const textContent = messageContent
                .filter((item) => item.type === 'text')
                .map((item) => item.text)
                .join('\n');
              if (textContent) {
                messages.push({ type: MessageSource.USER, content: textContent });
              }
            }
          }
        } else {
          if (Array.isArray(messageContent)) {
            const parts: string[] = [];
            for (const item of messageContent) {
              if (item.type === 'text') {
                parts.push(item.text);
              } else if (item.type === 'tool_use') {
                const toolName = item.name || 'Unknown';
                const toolInput = item.input || {};
                if (toolName === 'Bash') {
                  parts.push(`[tool: Bash] ${toolInput.command || toolInput.description || ''}`);
                } else if (toolName === 'Read') {
                  parts.push(`[tool: Read] ${toolInput.file_path || ''}`);
                } else if (toolName === 'Edit') {
                  parts.push(`[tool: Edit] ${toolInput.file_path || ''}`);
                } else if (toolName === 'Write') {
                  parts.push(`[tool: Write] ${toolInput.file_path || ''}`);
                } else if (toolName === 'Grep') {
                  parts.push(`[tool: Grep] ${toolInput.pattern || ''}`);
                } else if (toolName === 'Glob') {
                  parts.push(`[tool: Glob] ${toolInput.pattern || ''}`);
                } else {
                  parts.push(`[tool: ${toolName}]`);
                }
              }
            }
            if (parts.length > 0) {
              messages.push({ type: MessageSource.CC, content: parts.join('\n') });
            }
          } else if (typeof messageContent === 'string') {
            messages.push({ type: MessageSource.CC, content: messageContent });
          }
        }
      }
    } catch {}
  }

  let markdown = '';

  if (messages.length > 0) {
    const firstUser = messages.find((m) => ClaudeHelper.isUserMessage(m.type));
    const firstAssistant = messages.find((m) => ClaudeHelper.isCCMessage(m.type));

    if (firstUser) {
      markdown += '<user_message type="initial">\n';
      markdown += `${firstUser.content}\n`;
      markdown += '</user_message>\n\n';
    }

    if (firstAssistant) {
      markdown += '<cc_message type="initial">\n';
      markdown += `${firstAssistant.content}\n`;
      markdown += '</cc_message>\n\n';
      markdown += '----\n\n';
    }

    const middleMessages = messages.slice(2, -2);
    if (middleMessages.length > 0) {
      for (const msg of middleMessages) {
        if (ClaudeHelper.isUserMessage(msg.type)) {
          markdown += `<user_message>${msg.content}</user_message>\n\n`;
        } else {
          markdown += `<cc_message>${msg.content}</cc_message>\n\n`;
        }
      }
      markdown += '----\n\n';
    }

    if (messages.length > 2) {
      const lastUser = messages.filter((m) => ClaudeHelper.isUserMessage(m.type)).pop();
      const lastAssistant = messages.filter((m) => ClaudeHelper.isCCMessage(m.type)).pop();

      if (lastUser && lastUser !== firstUser) {
        markdown += '<user_message type="final">\n';
        markdown += `${lastUser.content}\n`;
        markdown += '</user_message>\n\n';
      }

      if (lastAssistant && lastAssistant !== firstAssistant) {
        markdown += '<cc_message type="final">\n';
        markdown += `${lastAssistant.content}\n`;
        markdown += '</cc_message>\n\n';
      }
    }

    markdown += '----\n\n';
    markdown += 'related info:\n';

    const filePattern = /(?:\/[a-zA-Z0-9/_.-]+\.(ts|js|tsx|jsx|json|md|sh|yaml|yml|env|sql|txt))/g;
    const fileMatches = content.match(filePattern);
    const uniqueFiles = fileMatches
      ? [...new Set(fileMatches)]
          .filter((f) => !f.includes('@') && !f.includes('\\'))
          .map((f) => (f.startsWith(repoRoot) ? f : `${repoRoot}${f}`))
      : [];

    const urlPattern = /https?:\/\/[a-zA-Z0-9./?=_%:-]*/g;
    const urlMatches = content.match(urlPattern);
    const uniqueUrls = urlMatches ? [...new Set(urlMatches)] : [];

    if (uniqueFiles.length > 0) {
      markdown += ' - files:\n';
      for (const file of uniqueFiles) {
        markdown += `   - ${file}\n`;
      }
    }

    if (uniqueUrls.length > 0) {
      markdown += ' - urls:\n';
      for (const url of uniqueUrls) {
        markdown += `   - ${url}\n`;
      }
    }
  }

  writeFileSync(outputFile, markdown, 'utf-8');
}

export async function compactSession(
  parsedFile: string,
  outputFile: string,
  promptTemplate: string,
  currentDir: string
): Promise<void> {
  const cleanupUuid = generateUuid();

  let prompt = `${CLAUDE_CODE_SESSION_COMPACTION_ID}: ${cleanupUuid}\n\n${promptTemplate}`;
  prompt = prompt.replace('___FILE_TO_COMPACT___', `@${parsedFile}`);
  prompt = prompt.replaceAll('___OUTPUT_FILE_PATH___', outputFile);

  await ClaudeHelper.executePromptNonInteractively(prompt);

  if (!existsSync(outputFile)) {
    throw new Error(`Summary file was not created at ${outputFile}`);
  }

  const normalized = ClaudeHelper.normalizePathForClaudeProjects(currentDir);
  const projectDir = join(ClaudeHelper.getProjectsDir(), normalized);

  if (!existsSync(projectDir)) {
    return;
  }

  const compactionSessions = readdirSync(projectDir)
    .filter((file) => file.endsWith('.jsonl'))
    .map((file) => join(projectDir, file))
    .filter((file) => {
      try {
        const content = readFileSync(file, 'utf-8');
        return content.includes(`${CLAUDE_CODE_SESSION_COMPACTION_ID}: ${cleanupUuid}`);
      } catch {
        return false;
      }
    });

  for (const session of compactionSessions) {
    unlinkSync(session);
  }
}
