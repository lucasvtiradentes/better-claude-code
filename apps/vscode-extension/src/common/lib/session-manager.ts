import { readFile } from 'node:fs/promises';
import {
  groupSessions,
  listSessionsCached,
  MessageCountMode,
  parseSessionMessages,
  readSettings,
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

      const settings = readSettings();

      const result = await listSessionsCached({
        projectPath,
        limit: 1000,
        messageCountMode: MessageCountMode.TURN,
        titleSource: TitleSource.FIRST_USER_MESSAGE,
        includeImages: true,
        includeCustomCommands: true,
        includeFilesOrFolders: true,
        includeUrls: true,
        includeLabels: true,
        sortBy: SessionSortBy.DATE,
        settings,
        skipCache: false
      });

      this.sessions = result.items;
      logger.info(`Loaded ${this.sessions.length} sessions (fresh - labels enabled)`);
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

  updateSessionLabels(sessionId: string, labels: string[]): void {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      logger.info(`Updating session ${sessionId} labels to: ${labels.join(', ')}`);
      session.labels = labels;
    } else {
      logger.warn(`Session ${sessionId} not found in loaded sessions`);
    }
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
    logger.info(`Grouping ${sessions.length} sessions by: ${this.groupByMode}`);

    try {
      const settings = this.groupByMode === 'label' ? readSettings() : undefined;

      if (this.groupByMode === 'label') {
        logger.info(
          `Label grouping - Found ${settings?.sessions.labels.length || 0} labels: ${settings?.sessions.labels.map((l) => l.name).join(', ')}`
        );
      }

      const groups = groupSessions({
        sessions,
        groupBy: this.groupByMode,
        settings,
        getCreatedAt: (session) => new Date(session.createdAt),
        getModifiedAt: (session) => new Date(session.createdAt),
        getTokenPercentage: (session) => session.tokenPercentage,
        getLabels: (session) => session.labels
      });

      logger.info(`Grouping complete - Created ${groups.length} groups`);

      return groups.map((group) => ({
        label: `${group.label} (${group.totalItems})`,
        sessions: group.items
      }));
    } catch (error) {
      logger.error(`Failed to group sessions by ${this.groupByMode}`, error as Error);
      throw error;
    }
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
