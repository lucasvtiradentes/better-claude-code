import { SessionBadges } from '@better-claude-code/ui-components';
import type { SessionData } from '../types';
import { FilterButtons } from './FilterButtons';
import { SessionActionsMenu } from './SessionActionsMenu';

type SessionHeaderProps = {
  session: SessionData['session'];
  imageCount: number;
  filesOrFoldersCount: number;
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
  hasCompacted: boolean;
  onToggleUser: () => void;
  onToggleAssistant: () => void;
  onToggleToolCalls: () => void;
  onOpenRaw: () => void;
  onDeleteSession: () => void;
  onCompactSession: () => void;
  onOpenParsed?: () => void;
  onOpenSummary?: () => void;
};

export const SessionHeader = ({
  session,
  imageCount,
  filesOrFoldersCount,
  showUserMessages,
  showAssistantMessages,
  showToolCalls,
  hasCompacted,
  onToggleUser,
  onToggleAssistant,
  onToggleToolCalls,
  onOpenRaw,
  onDeleteSession,
  onCompactSession,
  onOpenParsed,
  onOpenSummary
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
    <div className="px-4 py-4 border-b border-border flex items-center justify-between" style={{ flexShrink: 0 }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SessionBadges session={sessionForBadges} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <FilterButtons
          showUserMessages={showUserMessages}
          showAssistantMessages={showAssistantMessages}
          showToolCalls={showToolCalls}
          onToggleUser={onToggleUser}
          onToggleAssistant={onToggleAssistant}
          onToggleToolCalls={onToggleToolCalls}
        />
        <SessionActionsMenu
          hasCompacted={hasCompacted}
          onOpenRaw={onOpenRaw}
          onDeleteSession={onDeleteSession}
          onCompactSession={onCompactSession}
          onOpenParsed={onOpenParsed}
          onOpenSummary={onOpenSummary}
        />
      </div>
    </div>
  );
};
