export type Permission = {
  id: string;
  tool: string;
  description: string;
  path?: string;
  command?: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type StreamStatus = 'idle' | 'streaming' | 'pending-permissions' | 'completed' | 'error';
