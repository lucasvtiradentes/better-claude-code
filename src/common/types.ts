import type { SessionListItem } from '@/lib/node-utils';

export type { SessionListItem };

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
