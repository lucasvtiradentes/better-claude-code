import type { ChildProcess } from 'child_process';

export type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  imagePaths?: string[];
};

export type LiveSessionProcess = {
  process?: ChildProcess;
  sessionId: string;
  projectPath: string;
  createdAt: Date;
  status: SessionStatus;
  pendingPermissions: Permission[];
  messages: Message[];
};

export enum SessionStatus {
  IDLE = 'idle',
  STREAMING = 'streaming',
  PENDING_PERMISSIONS = 'pending-permissions',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export type Permission = {
  id: string;
  tool: string;
  description: string;
  path?: string;
  command?: string;
};

export type LiveSessionEvent =
  | { type: 'session-init'; sessionId: string; tools: string[]; model: string }
  | { type: 'history'; messages: Message[] }
  | { type: 'text-chunk'; content: string; role: 'assistant' }
  | { type: 'tool-call'; toolName: string; args: any }
  | { type: 'permission-request'; permission: Permission }
  | { type: 'error'; message: string }
  | { type: 'complete'; sessionId: string }
  | { type: 'status-change'; status: SessionStatus };
