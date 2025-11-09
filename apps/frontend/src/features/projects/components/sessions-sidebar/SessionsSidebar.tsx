import {
  getTimeGroup,
  getTokenPercentageGroup,
  TIME_GROUP_LABELS,
  TIME_GROUP_ORDER,
  TOKEN_PERCENTAGE_GROUP_LABELS,
  TOKEN_PERCENTAGE_GROUP_ORDER
} from '@better-claude-code/shared';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GetApiSessionsProjectName200ItemsItem } from '@/api/_generated/schemas';
import { GroupCardItems } from '@/components/GroupCardItems';
import { MiddleSidebar } from '@/components/layout/MiddleSidebar';
import { useSettingsStore } from '@/stores/settings-store';
import { SessionSettingsModal } from '../sessions-settings/SessionSettingsModal';
import { SessionCard } from './SessionCard';
import { SessionsHeader } from './SessionsHeader';

type SessionsSidebarProps = {
  sessions: GetApiSessionsProjectName200ItemsItem[] | undefined;
  isLoading: boolean;
  error: unknown;
  projectName: string;
  projectPath: string;
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
  onSortByChange?: (sortBy: 'date' | 'token-percentage') => void;
};

export const SessionsSidebar = ({
  sessions,
  isLoading,
  error,
  projectName,
  projectPath,
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
  const navigate = useNavigate();
  const settingsData = useSettingsStore((state) => state.settings);
  const [showSettings, setShowSettings] = useState(false);

  const settings = settingsData?.sessions;

  const handleCreateSession = () => {
    navigate({
      to: '/live/$sessionId',
      params: { sessionId: 'new' },
      search: { projectPath, projectName }
    });
  };

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
        {} as Record<string, GetApiSessionsProjectName200ItemsItem[]>
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
        {} as Record<string, GetApiSessionsProjectName200ItemsItem[]>
      );
    }

    if (settings.groupBy === 'label') {
      const grouped: Record<string, GetApiSessionsProjectName200ItemsItem[]> = {
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

  const getGroupLabel = (groupKey: string) => {
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

  const getGroupLabelColor = (groupKey: string) => {
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
      <MiddleSidebar>
        <SessionsHeader
          projectName={projectName}
          totalSessions={totalSessions}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSettingsClick={() => setShowSettings(true)}
          onBackClick={onBack}
          onCreateSession={handleCreateSession}
          projectId={projectId}
          isGitRepo={isGitRepo}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
                  <GroupCardItems
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
                  </GroupCardItems>
                );
              })}
              {isFetchingNextPage && <div className="p-4 text-center text-muted-foreground">Loading more...</div>}
            </>
          )}
        </div>
      </MiddleSidebar>

      {showSettings && <SessionSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};
