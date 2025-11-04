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
  filters: {
    selectedLabels: string[];
  };
  display: {
    showSessionCount: boolean;
    showCurrentBranch: boolean;
    showActionButtons: boolean;
    showProjectLabel: boolean;
  };
  search: string;
  labels: ProjectLabel[];
  projectSettings: Record<string, ProjectSettings>;
};

export type SessionsConfig = {
  groupBy: 'date' | 'token-percentage' | 'label';
  filters: Record<string, unknown>;
  display: {
    showTokenPercentage: boolean;
    showAttachments: boolean;
  };
  labels: ProjectLabel[];
};

export type AppSettings = {
  projects: ProjectsConfig;
  sessions: SessionsConfig;
};

export type Session = {
  id: string;
  title: string;
  messageCount: number;
  userMessageCount?: number;
  assistantMessageCount?: number;
  createdAt: number;
  tokenPercentage?: number;
  searchMatchCount?: number;
  imageCount?: number;
  customCommandCount?: number;
  filesOrFoldersCount?: number;
  labels?: string[];
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
