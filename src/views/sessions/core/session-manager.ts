import {
  getCompactionDir,
  getCompactionParsedPath,
  getCompactionSummaryPath
} from '../../../common/constants/monorepo-path-utils';
import { ClaudeHelper } from '../../../common/lib/claude-helper';
import { logger } from '../../../common/lib/logger';
import type { DateGroup, FilterCriteria, SessionStats } from '../../../common/types';
import { MessageCountMode } from '../../../common/utils/config-manager';
import { FileIOHelper } from '../../../common/utils/helpers/node-helper';
import { readSettings } from '../../../common/utils/label-manager';
import { CompactService } from './compact-service';
import { groupSessions } from './session-grouping';
import { type SessionListItem, SessionSortBy, TitleSource } from './session-list';
import { listSessionsCached } from './session-list-cached';
import { parseSessionMessages } from './session-parser';

export class SessionManager {
  private sessions: SessionListItem[] = [];
  private filter: FilterCriteria = {};
  private groupByMode: 'date' | 'token-percentage' | 'label' = 'date';
  private currentWorkspacePath: string | null = null;

  async loadSessions(projectPath: string): Promise<void> {
    try {
      this.currentWorkspacePath = projectPath;
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
      const content = await FileIOHelper.readFileAsync(session.filePath);
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

  getSessionPath(sessionId: string): string | null {
    const session = this.sessions.find((s) => s.id === sessionId);
    return session?.filePath || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionPath = this.getSessionPath(sessionId);
    if (!sessionPath) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await FileIOHelper.unlinkAsync(sessionPath);
      logger.info(`Deleted session file: ${sessionPath}`);

      if (this.currentWorkspacePath) {
        const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(this.currentWorkspacePath);
        const compactionDir = getCompactionDir(normalizedPath, sessionId);

        try {
          await FileIOHelper.rmAsync(compactionDir, { recursive: true, force: true });
          logger.info(`Deleted compaction directory: ${compactionDir}`);
        } catch (error) {
          logger.warn(
            `Failed to delete compaction directory (might not exist): ${compactionDir} - ${(error as Error).message}`
          );
        }
      }

      this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    } catch (error) {
      logger.error('Failed to delete session file', error as Error);
      throw error;
    }
  }

  async compactSession(sessionId: string, workspacePath: string): Promise<string> {
    const sessionPath = this.getSessionPath(sessionId);
    if (!sessionPath) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const compactService = new CompactService();

    try {
      logger.info(`Compacting session ${sessionId} at ${sessionPath}`);
      const summaryPath = await compactService.compactSession(sessionId, workspacePath);

      const session = this.sessions.find((s) => s.id === sessionId);
      if (session) {
        session.hasCompaction = true;
      }

      return summaryPath;
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      throw error;
    }
  }

  async getParsedSessionPath(sessionId: string): Promise<string | null> {
    if (!this.currentWorkspacePath) return null;

    const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(this.currentWorkspacePath);
    const parsedPath = getCompactionParsedPath(normalizedPath, sessionId);

    try {
      await FileIOHelper.accessAsync(parsedPath);
      return parsedPath;
    } catch {
      return null;
    }
  }

  async getSummaryPath(sessionId: string): Promise<string | null> {
    if (!this.currentWorkspacePath) return null;

    const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(this.currentWorkspacePath);
    const summaryPath = getCompactionSummaryPath(normalizedPath, sessionId);

    try {
      await FileIOHelper.accessAsync(summaryPath);
      return summaryPath;
    } catch {
      return null;
    }
  }
}
