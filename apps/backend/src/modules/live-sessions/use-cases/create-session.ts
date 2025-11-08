import { sessionManager } from '../session-manager';

export function createSession(projectPath: string, providedSessionId?: string): { sessionId: string; status: string } {
  const sessionId = sessionManager.createSession(projectPath, providedSessionId);

  return {
    sessionId,
    status: 'idle'
  };
}
