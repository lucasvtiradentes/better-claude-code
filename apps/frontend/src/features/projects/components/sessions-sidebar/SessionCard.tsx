import { FolderEntry } from '@better-claude-code/shared';
import { MoreHorizontal, Search, Tag, Trash2 } from 'lucide-react';
import { useGetApiSettings } from '@/api';
import type { GetApiSessionsProjectName200ItemsItem } from '@/api/_generated/schemas';
import { IconWithBadge } from '@/components/IconWithBadge';
import { SessionBadges } from './SessionBadges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  getCommandInTitleColor,
  getFileInTitleColor,
  getFlagColor,
  getLabelActiveColor,
  getTokenColor,
  getUltrathinkColor,
  getUrlColor,
  parseTitle
} from '@/features/projects/utils/message-patterns';

type SessionCardProps = {
  session: GetApiSessionsProjectName200ItemsItem;
  projectName: string;
  onClick: () => void;
  isActive?: boolean;
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
  displaySettings = {
    showTokenPercentage: true,
    showAttachments: false
  },
  onDelete,
  onLabelToggle
}: SessionCardProps) => {
  const { data: settingsData } = useGetApiSettings();

  const settings = settingsData?.sessions;

  const titleParts = parseTitle(session.title);

  const handleMenuAction = (e: React.MouseEvent<HTMLDivElement>, action: () => void) => {
    e.stopPropagation();
    console.log('[SessionCard] handleMenuAction called', { hasOnDelete: !!onDelete });
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

          {displaySettings.showTokenPercentage && session.tokenPercentage !== undefined && (
            <span className={getTokenColor(session.tokenPercentage)}>{session.tokenPercentage}%</span>
          )}
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
                  console.log('[SessionCard] Delete clicked', { sessionId: session.id, onDelete: !!onDelete });
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
