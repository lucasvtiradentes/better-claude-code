import type { GroupBy, SessionListItem } from '@/lib/node-utils';
import type { TimeGroup } from '@/lib/shared';

export type { SessionListItem };
export type { TimeGroup };
export type { GroupBy };

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
