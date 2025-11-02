export type Project = {
  id: string;
  name: string;
  path: string;
  sessionsCount: number;
  lastModified: number;
  isGitRepo: boolean;
  githubUrl?: string;
  currentBranch?: string;
  labels?: string[];
  hidden?: boolean;
};

export type ProjectLabel = {
  id: string;
  name: string;
  color: string;
};

export type ProjectSettings = {
  labels: string[];
  hidden: boolean;
};

export type ProjectsConfig = {
  groupBy: 'date' | 'label' | 'session-count';
  filters: {};
  display: {
    showSessionCount: boolean;
    showCurrentBranch: boolean;
    showActionButtons: boolean;
  };
  search: string;
  labels: ProjectLabel[];
  projectSettings: Record<string, ProjectSettings>;
};

export type AppSettings = {
  projects: ProjectsConfig;
};

export type Session = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  tokenPercentage?: number;
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
