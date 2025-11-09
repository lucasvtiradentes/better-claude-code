import { sessionManager } from '../session-manager.js';

export function listActiveSessions() {
  const sessions = sessionManager.getActiveSessions();

  return {
    sessions: sessions.map((session) => ({
      sessionId: session.sessionId,
      projectPath: session.projectPath,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      pendingPermissionsCount: session.pendingPermissions.length
    }))
  };
}
