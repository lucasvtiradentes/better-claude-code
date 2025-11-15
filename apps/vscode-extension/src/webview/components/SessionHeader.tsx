import { SessionBadges } from '@better-claude-code/ui-components';
import type { SessionData } from '../types';
import { FilterButtons } from './FilterButtons';

type SessionHeaderProps = {
  session: SessionData['session'];
  imageCount: number;
  filesOrFoldersCount: number;
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
  onToggleUser: () => void;
  onToggleAssistant: () => void;
  onToggleToolCalls: () => void;
};

export const SessionHeader = ({
  session,
  imageCount,
  filesOrFoldersCount,
  showUserMessages,
  showAssistantMessages,
  showToolCalls,
  onToggleUser,
  onToggleAssistant,
  onToggleToolCalls
}: SessionHeaderProps) => {
  const sessionForBadges = {
    ...session,
    modifiedAt: session.createdAt,
    imageCount,
    customCommandCount: 0,
    filesOrFoldersCount,
    urlCount: 0
  };

  return (
    <div className="px-5 py-4 border-b border-border flex items-center justify-between" style={{ flexShrink: 0 }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SessionBadges session={sessionForBadges} />
        </div>
      </div>
      <FilterButtons
        showUserMessages={showUserMessages}
        showAssistantMessages={showAssistantMessages}
        showToolCalls={showToolCalls}
        onToggleUser={onToggleUser}
        onToggleAssistant={onToggleAssistant}
        onToggleToolCalls={onToggleToolCalls}
      />
    </div>
  );
};
