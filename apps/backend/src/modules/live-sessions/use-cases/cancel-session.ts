import { sessionManager } from '../session-manager';
import { SessionStatus } from '../types';

export function cancelSession(sessionId: string): { success: boolean; message: string } {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return {
      success: false,
      message: 'Session not found'
    };
  }

  if (!session.process || session.process.killed) {
    sessionManager.updateStatus(sessionId, SessionStatus.CANCELLED);
    return {
      success: true,
      message: 'Session already terminated'
    };
  }

  try {
    session.process.kill('SIGTERM');

    setTimeout(() => {
      if (session.process && !session.process.killed) {
        console.warn(`Force killing Claude process for session ${sessionId}`);
        session.process.kill('SIGKILL');
      }
    }, 5000);

    sessionManager.updateStatus(sessionId, SessionStatus.CANCELLED);

    return {
      success: true,
      message: 'Session cancelled successfully'
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Failed to cancel session'
    };
  }
}
