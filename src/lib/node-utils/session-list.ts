import { MessageCountMode } from './config-manager.js';

export enum TitleSource {
  FIRST_USER_MESSAGE = 'first_user_message',
  LAST_CC_MESSAGE = 'last_cc_message'
}

export enum SessionSortBy {
  DATE = 'date',
  TOKEN_PERCENTAGE = 'tokenPercentage'
}

export type SessionListOptions = {
  projectPath: string;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: SessionSortBy;
  messageCountMode?: MessageCountMode;
  titleSource?: TitleSource;
  includeImages?: boolean;
  includeCustomCommands?: boolean;
  includeFilesOrFolders?: boolean;
  includeUrls?: boolean;
  includeLabels?: boolean;
  enablePagination?: boolean;
  settings?: {
    sessions: {
      labels: Array<{
        id: string;
        sessions?: Record<string, string[]>;
      }>;
    };
  };
};

export type SessionListItem = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  tokenPercentage?: number;
  imageCount?: number;
  customCommandCount?: number;
  filesOrFoldersCount?: number;
  urlCount?: number;
  labels?: string[];
  searchMatchCount?: number;
  filePath?: string;
  shortId?: string;
  userMessageCount?: number;
  assistantMessageCount?: number;
  summary?: string;
  cached?: boolean;
  hasCompaction?: boolean;
};

export type SessionListResult = {
  items: SessionListItem[];
  meta?: {
    totalItems: number;
    totalPages: number;
    page: number;
    limit: number;
  };
};
