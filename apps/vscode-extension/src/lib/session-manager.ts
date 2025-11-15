import { listSessions, MessageCountMode, SessionSortBy, TitleSource } from '@better-claude-code/node-utils';
import type { DateGroup, FilterCriteria, SessionListItem, SessionStats } from '../types.js';
import { DateGroupType } from '../types.js';
import { logger } from '../utils/logger.js';

export class SessionManager {
  private sessions: SessionListItem[] = [];
  private filter: FilterCriteria = {};

  async loadSessions(projectPath: string): Promise<void> {
    try {
      logger.info(`Loading sessions for project: ${projectPath}`);

      const result = await listSessions({
        projectPath,
        limit: 1000,
        messageCountMode: MessageCountMode.TURN,
        titleSource: TitleSource.FIRST_USER_MESSAGE,
        includeImages: true,
        includeCustomCommands: true,
        includeFilesOrFolders: true,
        includeUrls: true,
        sortBy: SessionSortBy.DATE
      });

      this.sessions = result.items;
      logger.info(`Loaded ${this.sessions.length} sessions`);
    } catch (error) {
      logger.error('Failed to load sessions', error as Error);
      this.sessions = [];
    }
  }

  setFilter(filter: FilterCriteria): void {
    this.filter = filter;
  }

  getFilteredSessions(): SessionListItem[] {
    return this.sessions.filter((session) => {
      if (this.filter.dateRange) {
        const createdAt = new Date(session.createdAt);
        if (this.filter.dateRange.start && createdAt < this.filter.dateRange.start) {
          return false;
        }
        if (this.filter.dateRange.end && createdAt > this.filter.dateRange.end) {
          return false;
        }
      }

      if (this.filter.minTokens !== undefined) {
        const tokenPercentage = session.tokenPercentage || 0;
        if (tokenPercentage < this.filter.minTokens) {
          return false;
        }
      }

      if (this.filter.maxTokens !== undefined) {
        const tokenPercentage = session.tokenPercentage || 0;
        if (tokenPercentage > this.filter.maxTokens) {
          return false;
        }
      }

      if (this.filter.hasImages !== undefined) {
        const hasImages = (session.imageCount || 0) > 0;
        if (hasImages !== this.filter.hasImages) {
          return false;
        }
      }

      if (this.filter.hasCustomCommands !== undefined) {
        const hasCustomCommands = (session.customCommandCount || 0) > 0;
        if (hasCustomCommands !== this.filter.hasCustomCommands) {
          return false;
        }
      }

      return true;
    });
  }

  groupByDate(sessions: SessionListItem[]): DateGroup[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const groups: Map<DateGroupType, SessionListItem[]> = new Map([
      [DateGroupType.TODAY, []],
      [DateGroupType.YESTERDAY, []],
      [DateGroupType.THIS_WEEK, []],
      [DateGroupType.OLDER, []]
    ]);

    for (const session of sessions) {
      const createdAt = new Date(session.createdAt);

      if (createdAt >= todayStart) {
        groups.get(DateGroupType.TODAY)!.push(session);
      } else if (createdAt >= yesterdayStart) {
        groups.get(DateGroupType.YESTERDAY)!.push(session);
      } else if (createdAt >= thisWeekStart) {
        groups.get(DateGroupType.THIS_WEEK)!.push(session);
      } else {
        groups.get(DateGroupType.OLDER)!.push(session);
      }
    }

    const result: DateGroup[] = [];

    const todaySessions = groups.get(DateGroupType.TODAY)!;
    if (todaySessions.length > 0) {
      result.push({ label: `Today (${todaySessions.length})`, sessions: todaySessions });
    }

    const yesterdaySessions = groups.get(DateGroupType.YESTERDAY)!;
    if (yesterdaySessions.length > 0) {
      result.push({ label: `Yesterday (${yesterdaySessions.length})`, sessions: yesterdaySessions });
    }

    const thisWeekSessions = groups.get(DateGroupType.THIS_WEEK)!;
    if (thisWeekSessions.length > 0) {
      result.push({ label: `This Week (${thisWeekSessions.length})`, sessions: thisWeekSessions });
    }

    const olderSessions = groups.get(DateGroupType.OLDER)!;
    if (olderSessions.length > 0) {
      result.push({ label: `Older (${olderSessions.length})`, sessions: olderSessions });
    }

    return result;
  }

  getStats(sessions: SessionListItem[]): SessionStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let todayCount = 0;
    let totalTokens = 0;

    for (const session of sessions) {
      const createdAt = new Date(session.createdAt);
      if (createdAt >= todayStart) {
        todayCount++;
      }
      totalTokens += session.tokenPercentage || 0;
    }

    return {
      totalSessions: sessions.length,
      totalTokens,
      todayCount
    };
  }
}
