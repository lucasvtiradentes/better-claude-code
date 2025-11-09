import { sessionManager } from '../session-manager';

export function getSessionStatus(sessionId: string) {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    status: session.status,
    pendingPermissions: session.pendingPermissions.map((p) => ({
      id: p.id,
      tool: p.tool,
      description: p.description,
      path: p.path,
      command: p.command
    }))
  };
}
