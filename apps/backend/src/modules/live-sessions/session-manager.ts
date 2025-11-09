import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import type { LiveSessionProcess, Permission, SessionStatus } from './types';

class SessionManager extends EventEmitter {
  private sessions: Map<string, LiveSessionProcess> = new Map();
  private readonly MAX_SESSIONS = 10;

  createSession(projectPath: string, sessionId?: string): string {
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error(`Maximum number of concurrent sessions (${this.MAX_SESSIONS}) reached`);
    }

    const id = sessionId || randomUUID();

    const existingSession = this.sessions.get(id);
    if (existingSession) {
      console.log(`[SessionManager] Session ${id} already exists in memory, reusing`);
      return id;
    }

    const session: Partial<LiveSessionProcess> = {
      sessionId: id,
      projectPath,
      createdAt: new Date(),
      status: 'idle' as SessionStatus,
      pendingPermissions: [],
      messages: []
    };

    this.sessions.set(id, session as LiveSessionProcess);
    console.log(`[SessionManager] Created new in-memory session ${id}`);
    return id;
  }

  getSession(sessionId: string): LiveSessionProcess | undefined {
    return this.sessions.get(sessionId);
  }

  setProcess(sessionId: string, process: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.process = process;
    }
  }

  updateStatus(sessionId: string, status: SessionStatus): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      this.emit('statusChange', { sessionId, status });
    }
  }

  addPendingPermission(sessionId: string, permission: Permission): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pendingPermissions.push(permission);
    }
  }

  clearPendingPermissions(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pendingPermissions = [];
    }
  }

  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session?.process && !session.process.killed) {
      session.process.kill('SIGTERM');
      setTimeout(() => {
        if (session.process && !session.process.killed) {
          session.process.kill('SIGKILL');
        }
      }, 5000);
    }
    this.sessions.delete(sessionId);
  }

  getActiveSessions(): LiveSessionProcess[] {
    return Array.from(this.sessions.values());
  }

  addMessage(sessionId: string, message: { role: 'user' | 'assistant'; content: string }): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        id: randomUUID(),
        role: message.role,
        content: message.content,
        timestamp: new Date()
      });
      console.log(`[SessionManager] Added ${message.role} message to in-memory session ${sessionId}`);
    }
  }

  getMessages(sessionId: string): any[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  cleanup(): void {
    for (const [sessionId] of this.sessions) {
      this.deleteSession(sessionId);
    }
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();
