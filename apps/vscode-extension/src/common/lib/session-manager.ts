import { readFile } from 'node:fs/promises';
import {
  groupSessions,
  listSessionsCached,
  MessageCountMode,
  parseSessionMessages,
  SessionSortBy,
  TitleSource
} from '@better-claude-code/node-utils';
import type { DateGroup, FilterCriteria, SessionListItem, SessionStats } from '../types.js';
import { logger } from '../utils/logger.js';

export class SessionManager {
  private sessions: SessionListItem[] = [];
  private filter: FilterCriteria = {};
  private groupByMode: 'date' | 'token-percentage' | 'label' = 'date';

  async loadSessions(projectPath: string): Promise<void> {
    try {
      logger.info(`Loading sessions for project: ${projectPath}`);

      const result = await listSessionsCached({
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
      logger.info(`Loaded ${this.sessions.length} sessions (cached)`);
    } catch (error) {
      logger.error('Failed to load sessions', error as Error);
      this.sessions = [];
    }
  }

  setFilter(filter: FilterCriteria): void {
    this.filter = filter;
  }

  setGroupBy(groupBy: 'date' | 'token-percentage' | 'label'): void {
    this.groupByMode = groupBy;
  }

  getGroupBy(): 'date' | 'token-percentage' | 'label' {
    return this.groupByMode;
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
    const groups = groupSessions({
      sessions,
      groupBy: this.groupByMode,
      getCreatedAt: (session) => new Date(session.createdAt),
      getModifiedAt: (session) => new Date(session.createdAt),
      getTokenPercentage: (session) => session.tokenPercentage,
      getLabels: (session) => session.labels
    });

    return groups.map((group) => ({
      label: `${group.label} (${group.totalItems})`,
      sessions: group.items
    }));
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

  async getSessionConversation(session: SessionListItem) {
    if (!session.filePath) {
      throw new Error('Session file path not available');
    }

    try {
      const content = await readFile(session.filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());
      const events = lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((e) => e !== null);

      return parseSessionMessages(events, {
        groupMessages: true,
        includeImages: true
      });
    } catch (error) {
      logger.error('Failed to parse session conversation', error as Error);
      throw error;
    }
  }
}
