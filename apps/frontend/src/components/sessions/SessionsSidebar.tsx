import type { Session } from '@bcc/shared';
import { TIME_GROUP_LABELS, TIME_GROUP_ORDER } from '@bcc/shared';
import { MiddleSidebar } from '../layout/MiddleSidebar';
import { TimeGroup } from '../TimeGroup';
import { SessionCard } from './SessionCard';

type SessionsSidebarProps = {
  sessions: Session[] | undefined;
  groupedSessions: Record<string, Session[]> | undefined;
  isLoading: boolean;
  error: unknown;
  repoName: string;
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
};

export const SessionsSidebar = ({
  sessions,
  groupedSessions,
  isLoading,
  error,
  repoName,
  onBack,
  onSelectSession
}: SessionsSidebarProps) => {
  return (
    <MiddleSidebar
      title={`${sessions?.length || 0} sessions`}
      backButton={{
        label: '← Back',
        onClick: onBack
      }}
    >
      {error ? (
        <div className="p-4 text-red-500">Failed to load sessions</div>
      ) : isLoading ? (
        <div className="p-4 text-[#858585]">Loading sessions...</div>
      ) : (
        TIME_GROUP_ORDER.map((timeGroup) => {
          const groupSessions = groupedSessions?.[timeGroup];
          if (!groupSessions?.length) return null;

          return (
            <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]} groupKey={timeGroup}>
              {groupSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  repoName={repoName}
                  onClick={() => onSelectSession(session.id)}
                />
              ))}
            </TimeGroup>
          );
        })
      )}
    </MiddleSidebar>
  );
};
