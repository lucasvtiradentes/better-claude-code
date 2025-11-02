import type { Session } from '@bcc/shared';
import { TIME_GROUP_LABELS, TIME_GROUP_ORDER } from '@bcc/shared';
import { useEffect, useRef } from 'react';
import { MiddleSidebar } from '../layout/MiddleSidebar';
import { TimeGroup } from '../TimeGroup';
import { SessionCard } from './SessionCard';

type SessionsSidebarProps = {
  sessions: Session[] | undefined;
  groupedSessions: Record<string, Session[]> | undefined;
  isLoading: boolean;
  error: unknown;
  projectName: string;
  selectedSessionId?: string;
  totalSessions: number;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
};

export const SessionsSidebar = ({
  groupedSessions,
  isLoading,
  error,
  projectName,
  selectedSessionId,
  totalSessions,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onBack,
  onSelectSession
}: SessionsSidebarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <MiddleSidebar
      title={`${projectName} (${totalSessions})`}
      backButton={{
        label: '← Back',
        onClick: onBack
      }}
      scrollRef={scrollRef}
    >
      {error ? (
        <div className="p-4 text-red-500">Failed to load sessions</div>
      ) : isLoading ? (
        <div className="p-4 text-muted-foreground">Loading sessions...</div>
      ) : (
        <>
          {TIME_GROUP_ORDER.map((timeGroup) => {
            const groupSessions = groupedSessions?.[timeGroup];
            if (!groupSessions?.length) return null;

            return (
              <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]} groupKey={timeGroup}>
                {groupSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    projectName={projectName}
                    isActive={session.id === selectedSessionId}
                    onClick={() => onSelectSession(session.id)}
                  />
                ))}
              </TimeGroup>
            );
          })}
          {isFetchingNextPage && <div className="p-4 text-center text-muted-foreground">Loading more...</div>}
        </>
      )}
    </MiddleSidebar>
  );
};
