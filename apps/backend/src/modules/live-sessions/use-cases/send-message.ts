import { sessionManager } from '../session-manager';
import { SessionStatus } from '../types';

export function sendMessage(
  sessionId: string,
  message: string,
  _projectPath?: string
): { success: boolean; error?: string; pending?: boolean } {
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

  console.log(`[send-message] Adding message to session ${sessionId}`);
  sessionManager.addMessage(sessionId, { role: 'user', content: message });

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
    const userMessage = `${JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text: message }]
      }
    })}\n`;

    sessionManager.updateStatus(sessionId, SessionStatus.STREAMING);
    session.process.stdin.write(userMessage);
    console.log('[send-message] Message sent to stdin, status updated to STREAMING');
    return { success: true };
  } catch (e) {
    console.error('[send-message] Error:', e);
    sessionManager.updateStatus(sessionId, SessionStatus.ERROR);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to send message'
    };
  }
}
