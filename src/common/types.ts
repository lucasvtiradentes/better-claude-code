import type { SessionListItem } from '../views/sessions/core';

export type DateGroup = {
  label: string;
  sessions: SessionListItem[];
};

export type FilterCriteria = {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  minTokens?: number;
  maxTokens?: number;
  hasImages?: boolean;
  hasCustomCommands?: boolean;
};

export type SessionStats = {
  totalSessions: number;
  totalTokens: number;
  todayCount: number;
};
