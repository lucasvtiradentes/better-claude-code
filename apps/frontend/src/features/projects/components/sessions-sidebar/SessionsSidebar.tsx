import { TimeGroup } from '@/components/common/TimeGroup';
import { MiddleSidebar } from '@/components/layout/MiddleSidebar';
import type { Session } from '@better-claude-code/shared';
import {
  getTimeGroup,
  getTokenPercentageGroup,
  TIME_GROUP_LABELS,
  TIME_GROUP_ORDER,
  TOKEN_PERCENTAGE_GROUP_LABELS,
  TOKEN_PERCENTAGE_GROUP_ORDER
} from '@better-claude-code/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../../../api/use-settings';
import { SessionSettingsModal } from '../sessions-settings/SessionSettingsModal';
import { SessionCard } from './SessionCard';
import { SessionsHeader } from './SessionsHeader';

type SessionsSidebarProps = {
  sessions: Session[] | undefined;
  isLoading: boolean;
  error: unknown;
  projectName: string;
  selectedSessionId?: string;
  totalSessions: number;
  searchValue?: string;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onSearchChange: (value: string) => void;
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onLabelToggle?: (sessionId: string, labelId: string) => void;
  projectId: string;
  isGitRepo?: boolean;
};

export const SessionsSidebar = ({
  sessions,
  isLoading,
  error,
  projectName,
  selectedSessionId,
  totalSessions,
  searchValue,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSearchChange,
  onBack,
  onSelectSession,
  onDeleteSession,
  onLabelToggle,
  projectId,
  isGitRepo
}: SessionsSidebarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: settingsData } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const settings = settingsData?.sessions;

  const groupedSessions = useMemo(() => {
    if (!sessions || !settings) return undefined;

    if (settings.groupBy === 'date') {
      return sessions.reduce(
        (acc, session) => {
          const group = getTimeGroup(session.createdAt);
          if (!acc[group]) acc[group] = [];
          acc[group].push(session);
          return acc;
        },
        {} as Record<string, Session[]>
      );
    }

    if (settings.groupBy === 'token-percentage') {
      return sessions.reduce(
        (acc, session) => {
          const group = getTokenPercentageGroup(session.tokenPercentage);
          if (!acc[group]) acc[group] = [];
          acc[group].push(session);
          return acc;
        },
        {} as Record<string, Session[]>
      );
    }

    if (settings.groupBy === 'label') {
      const grouped: Record<string, Session[]> = {
        'no-label': []
      };

      sessions.forEach((session) => {
        if (!session.labels || session.labels.length === 0) {
          grouped['no-label'].push(session);
        } else {
          session.labels.forEach((labelId) => {
            const label = settings.labels.find((l) => l.id === labelId);
            if (label) {
              if (!grouped[label.id]) grouped[label.id] = [];
              grouped[label.id].push(session);
            }
          });
        }
      });

      return grouped;
    }

    return undefined;
  }, [sessions, settings]);

  const getGroupLabel = (groupKey: string): string => {
    if (!settings) return groupKey;

    if (settings.groupBy === 'date') {
      return TIME_GROUP_LABELS[groupKey as keyof typeof TIME_GROUP_LABELS] || groupKey;
    }

    if (settings.groupBy === 'token-percentage') {
      return TOKEN_PERCENTAGE_GROUP_LABELS[groupKey as keyof typeof TOKEN_PERCENTAGE_GROUP_LABELS] || groupKey;
    }

    if (settings.groupBy === 'label') {
      if (groupKey === 'no-label') return 'No Label';
      const label = settings.labels.find((l) => l.id === groupKey);
      return label ? label.name : groupKey;
    }

    return groupKey;
  };

  const getGroupLabelColor = (groupKey: string): string | undefined => {
    if (!settings || settings.groupBy !== 'label' || groupKey === 'no-label') return undefined;
    const label = settings.labels.find((l) => l.id === groupKey);
    return label?.color;
  };

  const getGroupOrder = (): string[] => {
    if (!settings) return [];

    if (settings.groupBy === 'date') {
      return TIME_GROUP_ORDER;
    }

    if (settings.groupBy === 'token-percentage') {
      return TOKEN_PERCENTAGE_GROUP_ORDER;
    }

    if (settings.groupBy === 'label') {
      const labelIds = settings.labels.map((l) => l.id);
      return [...labelIds, 'no-label'];
    }

    return [];
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <>
      <MiddleSidebar scrollRef={scrollRef}>
        <SessionsHeader
          projectName={projectName}
          totalSessions={totalSessions}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSettingsClick={() => setShowSettings(true)}
          onBackClick={onBack}
          projectId={projectId}
          isGitRepo={isGitRepo}
        />

        {error ? (
          <div className="p-4 text-red-500">Failed to load sessions</div>
        ) : isLoading ? (
          <div className="p-4 text-muted-foreground">Loading sessions...</div>
        ) : (
          <>
            {getGroupOrder().map((groupKey) => {
              const groupSessions = groupedSessions?.[groupKey];
              if (!groupSessions?.length) return null;

              return (
                <TimeGroup
                  key={groupKey}
                  label={getGroupLabel(groupKey)}
                  groupKey={groupKey as any}
                  labelColor={getGroupLabelColor(groupKey)}
                >
                  {groupSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      projectName={projectName}
                      isActive={session.id === selectedSessionId}
                      onClick={() => onSelectSession(session.id)}
                      displaySettings={settings?.display}
                      onDelete={onDeleteSession}
                      onLabelToggle={onLabelToggle}
                    />
                  ))}
                </TimeGroup>
              );
            })}
            {isFetchingNextPage && <div className="p-4 text-center text-muted-foreground">Loading more...</div>}
          </>
        )}
      </MiddleSidebar>

      {showSettings && <SessionSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};
