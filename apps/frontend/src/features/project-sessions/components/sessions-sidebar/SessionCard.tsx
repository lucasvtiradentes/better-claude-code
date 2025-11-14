import { FolderEntry } from '@better-claude-code/shared';
import { MoreHorizontal, Search, Tag, Trash2 } from 'lucide-react';
import type { GetApiSessionsProjectName200GroupsItemItemsItem } from '@/api/_generated/schemas';
import { IconWithBadge } from '@/common/components/IconWithBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/common/components/ui/dropdown-menu';
import { useSettingsStore } from '@/common/stores/settings-store';
import {
  getCommandInTitleColor,
  getFileInTitleColor,
  getFlagColor,
  getImageColor,
  getLabelActiveColor,
  getTokenColor,
  getUltrathinkColor,
  getUrlColor,
  parseTitle
} from '@/features/projects/utils/message-patterns';
import { SessionBadges } from './SessionBadges';

type SessionCardProps = {
  session: GetApiSessionsProjectName200GroupsItemItemsItem;
  projectName: string;
  onClick: () => void;
  isActive?: boolean;
  groupKey?: string;
  displaySettings?: {
    showTokenPercentage: boolean;
    showAttachments: boolean;
  };
  onDelete?: (sessionId: string) => void;
  onLabelToggle?: (sessionId: string, labelId: string) => void;
};

export const SessionCard = ({
  session,
  onClick,
  isActive,
  groupKey,
  displaySettings = {
    showTokenPercentage: true,
    showAttachments: true
  },
  onDelete,
  onLabelToggle
}: SessionCardProps) => {
  const settingsData = useSettingsStore((state) => state.settings);
  const settings = settingsData?.sessions;

  const titleParts = parseTitle(session.title);

  const getRelativeTime = (isoDate: string) => {
    const now = new Date();
    const date = new Date(isoDate);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleMenuAction = (e: React.MouseEvent<HTMLDivElement>, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={`
        relative w-full text-left px-4 py-3
        border-b border-border transition-all duration-100
        hover:bg-accent group
        ${isActive ? 'bg-primary/20' : ''}
      `}
    >
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="text-sm font-semibold mb-1 wrap-break-word line-clamp-2 pr-8">
          {titleParts.map((part, i) => (
            <span
              key={`${part.text}-${i}`}
              className={
                part.type === FolderEntry.FILE
                  ? getFileInTitleColor()
                  : part.type === 'command'
                    ? getCommandInTitleColor()
                    : part.type === 'url'
                      ? getUrlColor()
                      : part.type === 'ultrathink'
                        ? getUltrathinkColor()
                        : part.type === 'flag'
                          ? getFlagColor()
                          : part.type === 'image'
                            ? getImageColor()
                            : ''
              }
            >
              {part.text}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {session.searchMatchCount !== undefined && (
              <span className={getLabelActiveColor()}>
                <IconWithBadge
                  icon={Search}
                  count={session.searchMatchCount}
                  label={`${session.searchMatchCount} matches`}
                />
              </span>
            )}
            {displaySettings.showAttachments && <SessionBadges session={session} />}
          </div>

          <div className="flex items-center gap-2">
            {groupKey === 'today' && (
              <span className="text-muted-foreground">{getRelativeTime(session.modifiedAt)}</span>
            )}
            {displaySettings.showTokenPercentage && session.tokenPercentage !== undefined && (
              <span className={getTokenColor(session.tokenPercentage)}>{session.tokenPercentage}%</span>
            )}
          </div>
        </div>
      </button>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1 hover:bg-accent rounded-sm"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e: React.MouseEvent<HTMLDivElement>) => handleMenuAction(e, onClick)}>
              Open session
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="h-4 w-4 mr-2" />
                Label
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {settings?.labels.length === 0 ? (
                  <DropdownMenuItem disabled>No labels available</DropdownMenuItem>
                ) : (
                  settings?.labels.map((label) => {
                    const isLabeled = session.labels?.includes(label.id);
                    return (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                          handleMenuAction(e, () => onLabelToggle?.(session.id, label.id))
                        }
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: label.color }} />
                          <span className="flex-1">{label.name}</span>
                          {isLabeled && <span className={getLabelActiveColor()}>✓</span>}
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                handleMenuAction(e, () => {
                  onDelete?.(session.id);
                })
              }
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
