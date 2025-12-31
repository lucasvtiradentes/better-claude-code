import {
  getTimeGroup,
  getTokenPercentageGroup,
  TIME_GROUP_LABELS,
  TIME_GROUP_ORDER,
  type TimeGroup,
  TOKEN_PERCENTAGE_GROUP_LABELS,
  TOKEN_PERCENTAGE_GROUP_ORDER,
  type TokenPercentageGroup
} from './duplicated.js';
import type { SessionListItem } from './session-list.js';

export type SessionLabel = {
  id: string;
  name: string;
  color: string;
};

export type SettingsForGrouping = {
  sessions: {
    labels: SessionLabel[];
  };
};

export type GroupBy = 'date' | 'token-percentage' | 'label';

export type SessionGroup<T = SessionListItem> = {
  key: string;
  label: string;
  color: string | null;
  items: T[];
  totalItems: number;
};

export type GroupSessionsOptions<T = SessionListItem> = {
  sessions: T[];
  groupBy: GroupBy;
  settings?: SettingsForGrouping;
  getCreatedAt: (session: T) => Date;
  getModifiedAt: (session: T) => Date;
  getTokenPercentage: (session: T) => number | undefined;
  getLabels: (session: T) => string[] | undefined;
};

export function groupSessions<T = SessionListItem>(options: GroupSessionsOptions<T>): SessionGroup<T>[] {
  const { sessions, groupBy, settings, getCreatedAt, getModifiedAt, getTokenPercentage, getLabels } = options;

  const grouped: Record<string, T[]> = {};

  const sortByModifiedAt = (items: T[]) =>
    items.sort((a, b) => getModifiedAt(b).getTime() - getModifiedAt(a).getTime());

  const sortByTokenPercentage = (items: T[]) =>
    items.sort((a, b) => {
      const aTokens = getTokenPercentage(a) || 0;
      const bTokens = getTokenPercentage(b) || 0;
      return bTokens - aTokens;
    });

  if (groupBy === 'date') {
    sessions.forEach((session) => {
      const groupKey = getTimeGroup(getCreatedAt(session).getTime());
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(session);
    });

    return TIME_GROUP_ORDER.map((key) => ({
      key,
      label: TIME_GROUP_LABELS[key as TimeGroup],
      color: null,
      items: sortByModifiedAt(grouped[key] || []),
      totalItems: grouped[key]?.length || 0
    })).filter((g) => g.totalItems > 0);
  }

  if (groupBy === 'token-percentage') {
    sessions.forEach((session) => {
      const groupKey = getTokenPercentageGroup(getTokenPercentage(session));
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(session);
    });

    return TOKEN_PERCENTAGE_GROUP_ORDER.map((key) => ({
      key,
      label: TOKEN_PERCENTAGE_GROUP_LABELS[key as TokenPercentageGroup],
      color: null,
      items: sortByTokenPercentage(grouped[key] || []),
      totalItems: grouped[key]?.length || 0
    })).filter((g) => g.totalItems > 0);
  }

  if (groupBy === 'label') {
    grouped['no-label'] = [];

    sessions.forEach((session) => {
      const labels = getLabels(session);
      if (!labels || labels.length === 0) {
        grouped['no-label'].push(session);
      } else {
        labels.forEach((labelId) => {
          if (!grouped[labelId]) grouped[labelId] = [];
          grouped[labelId].push(session);
        });
      }
    });

    if (!settings) {
      throw new Error('Settings are required for label grouping');
    }

    const labelIds = settings.sessions.labels.map((l) => l.id);
    return [...labelIds, 'no-label']
      .map((key) => {
        const label = settings.sessions.labels.find((l) => l.id === key);
        return {
          key,
          label: key === 'no-label' ? 'No Label' : label?.name || key,
          color: label?.color || null,
          items: sortByModifiedAt(grouped[key] || []),
          totalItems: grouped[key]?.length || 0
        };
      })
      .filter((g) => g.totalItems > 0);
  }

  return [];
}
