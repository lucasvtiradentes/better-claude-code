import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import type { GetApiSessionsProjectName200GroupsItem } from '@/api/_generated/schemas';
import { GroupCardItems } from '@/common/components/GroupCardItems';
import { MiddleSidebar } from '@/common/components/layout/MiddleSidebar';
import { useSettingsStore } from '@/common/stores/settings-store';
import { SessionSettingsModal } from '../sessions-settings/SessionSettingsModal';
import { SessionCard } from './SessionCard';
import { SessionsHeader } from './SessionsHeader';

type SessionsSidebarProps = {
  sessions: GetApiSessionsProjectName200GroupsItem[] | undefined;
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
          isLoading={isLoading}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-4 text-red-500">Failed to load sessions</div>
          ) : isLoading ? (
            <div className="p-4 text-muted-foreground">Loading sessions...</div>
          ) : (
            sessions?.map((group) => {
              if (!group.items?.length) return null;

              return (
                <GroupCardItems
                  key={group.key}
                  label={group.label}
                  groupKey={group.key as any}
                  labelColor={group.color || undefined}
                >
                  {group.items.map((session) => (
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
            })
          )}
        </div>
      </MiddleSidebar>

      {showSettings && <SessionSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};
