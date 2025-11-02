export type Repository = {
  name: string;
  path: string;
  sessionsCount: number;
  lastModified: number;
  isGitRepo: boolean;
};

export type Session = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  tokenUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
};

export type MessageType = 'user' | 'assistant';

export type ToolCall = {
  type: 'tool_use';
  name: string;
  input: Record<string, unknown>;
};

export type MessageContent =
  | string
  | Array<{
      type: 'text' | 'image' | 'tool_use' | 'tool_result';
      text?: string;
      source?: { data: string };
      name?: string;
      input?: Record<string, unknown>;
    }>;

export type Message = {
  type: MessageType;
  content: MessageContent;
  timestamp?: number;
  model?: string;
  stop_reason?: string;
};

export type SessionData = {
  messages: Message[];
  images: Array<{ index: number; data: string }>;
};

export type TimeGroup = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-month' | 'older';
