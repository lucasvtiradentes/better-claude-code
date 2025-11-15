import type { SessionListItem } from '@better-claude-code/node-utils';

export type { SessionListItem };

export interface DateGroup {
  label: string;
  sessions: SessionListItem[];
}

export enum DateGroupType {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  OLDER = 'older'
}

export interface FilterCriteria {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  minTokens?: number;
  maxTokens?: number;
  hasImages?: boolean;
  hasCustomCommands?: boolean;
}

export interface SessionStats {
  totalSessions: number;
  totalTokens: number;
  todayCount: number;
}
