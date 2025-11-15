import type { SessionListItem } from '@better-claude-code/node-utils';
import type { TimeGroup } from '@better-claude-code/shared';

export type { SessionListItem };
export type { TimeGroup };

export interface DateGroup {
  label: string;
  sessions: SessionListItem[];
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
