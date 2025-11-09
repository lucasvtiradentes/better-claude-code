import { readFileSync } from 'node:fs';
import { generateUuid } from '@better-claude-code/node-utils';
import { sessionManager } from '../session-manager.js';
import { SessionStatus } from '../types.js';

export function sendMessage(
  sessionId: string,
  message: string,
  imagePaths?: string[],
  _projectPath?: string
): { success: boolean; error?: string; pending?: boolean; messageId?: string } {
  console.log(`[send-message] Received message for session: ${sessionId}`);

  const session = sessionManager.getSession(sessionId);

  if (!session) {
    if (sessionId === 'new') {
      console.log('[send-message] Session is new, message will be queued and sent after init event');
      return { success: true, pending: true };
    }

    console.error(`[send-message] Session ${sessionId} not found`);
    return {
      success: false,
      error: 'Session not found'
    };
  }

  const messageId = generateUuid();
  console.log(`[send-message] Adding message to session ${sessionId} with ID ${messageId}`);
  sessionManager.addMessage(sessionId, { id: messageId, role: 'user', content: message, imagePaths });

  if (!session.process || session.process.killed) {
    console.log('[send-message] No active process yet, message queued. Stream will send it when connected.');
    return { success: true, pending: true };
  }

  if (!session.process.stdin) {
    return {
      success: false,
      error: 'Process stdin is not available'
    };
  }

  try {
    const content: any[] = [];

    if (message) {
      content.push({ type: 'text', text: message });
    }

    if (imagePaths && imagePaths.length > 0) {
      for (const path of imagePaths) {
        try {
          const buffer = readFileSync(path);
          const base64 = buffer.toString('base64');
          let mediaType = 'image/png';

          if (path.endsWith('.jpg') || path.endsWith('.jpeg')) mediaType = 'image/jpeg';
          else if (path.endsWith('.gif')) mediaType = 'image/gif';
          else if (path.endsWith('.webp')) mediaType = 'image/webp';
          else if (path.endsWith('.bmp')) mediaType = 'image/bmp';

          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64
            }
          });
        } catch (error) {
          console.error(`[send-message] Failed to read image ${path}:`, error);
        }
      }
    }

    const userMessage = `${JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content
      }
    })}\n`;

    sessionManager.updateStatus(sessionId, SessionStatus.STREAMING);
    session.process.stdin.write(userMessage);
    console.log('[send-message] Message sent to stdin, status updated to STREAMING');
    return { success: true, messageId };
  } catch (e) {
    console.error('[send-message] Error:', e);
    sessionManager.updateStatus(sessionId, SessionStatus.ERROR);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to send message'
    };
  }
}
