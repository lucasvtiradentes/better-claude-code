import { sessionManager } from '../session-manager.js';
import { SessionStatus } from '../types.js';

export function approvePermissions(
  sessionId: string,
  approvals: { id: string; approved: boolean }[]
): { success: boolean; processedCount: number; error?: string } {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return {
      success: false,
      processedCount: 0,
      error: 'Session not found'
    };
  }

  if (!session.process || session.process.killed) {
    return {
      success: false,
      processedCount: 0,
      error: 'No active Claude process for this session'
    };
  }

  let processedCount = 0;

  for (const approval of approvals) {
    const permission = session.pendingPermissions.find((p) => p.id === approval.id);

    if (permission && session.process.stdin) {
      const response = approval.approved ? 'yes\n' : 'no\n';
      session.process.stdin.write(response);
      processedCount++;
    }
  }

  sessionManager.clearPendingPermissions(sessionId);
  sessionManager.updateStatus(sessionId, SessionStatus.STREAMING);

  return {
    success: true,
    processedCount
  };
}
