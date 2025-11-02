import type { Session } from '@bcc/shared';
import { FileText, Image, Search, Terminal } from 'lucide-react';
import { IconWithBadge } from '../common/IconWithBadge';

type SessionCardProps = {
  session: Session;
  projectName: string;
  onClick: () => void;
  isActive?: boolean;
  displaySettings?: {
    showTokenPercentage: boolean;
    showAttachments: boolean;
  };
};

export const SessionCard = ({
  session,
  onClick,
  isActive,
  displaySettings = {
    showTokenPercentage: true,
    showAttachments: false
  }
}: SessionCardProps) => {
  const getTokenColor = (percentage: number) => {
    if (percentage >= 80) return 'text-destructive';
    if (percentage >= 50) return 'text-primary';
    return 'text-muted-foreground';
  };

  const parseTitle = (title: string) => {
    const parts: { text: string; type: 'normal' | 'file' | 'command' }[] = [];
    const fileRefRegex = /@[\w\-./]+/g;
    const commandRegex =
      /^(add|update|fix|refactor|improve|create|delete|remove|modify|change|implement|build|test|debug|optimize|enhance|cleanup|migrate|upgrade|downgrade|install|uninstall|configure|setup|deploy|publish|release|merge|rebase|cherry-pick|squash|revert)\s+/i;

    let lastIndex = 0;
    let match: RegExpExecArray | null = null;

    const isCommand = commandRegex.test(title);

    match = fileRefRegex.exec(title);
    while (match !== null) {
      if (match.index > lastIndex) {
        const text = title.slice(lastIndex, match.index);
        parts.push({ text, type: isCommand ? 'command' : 'normal' });
      }
      parts.push({ text: match[0], type: 'file' });
      lastIndex = match.index + match[0].length;
      match = fileRefRegex.exec(title);
    }

    if (lastIndex < title.length) {
      const text = title.slice(lastIndex);
      parts.push({ text, type: isCommand ? 'command' : 'normal' });
    }

    return parts;
  };

  const titleParts = parseTitle(session.title);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 cursor-pointer
        border-b border-border transition-all duration-100
        hover:bg-accent
        ${isActive ? 'bg-primary/20' : ''}
      `}
    >
      <div className="text-sm font-semibold mb-1 break-words line-clamp-2">
        {titleParts.map((part, i) => (
          <span
            key={`${part.text}-${i}`}
            className={
              part.type === 'file'
                ? 'text-primary font-semibold'
                : part.type === 'command'
                  ? 'text-chart-2 font-semibold'
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
            <span className="text-primary">
              <IconWithBadge
                icon={Search}
                count={session.searchMatchCount}
                label={`${session.searchMatchCount} matches`}
              />
            </span>
          )}
          {displaySettings.showAttachments && (
            <>
              {session.imageCount !== undefined && session.imageCount > 0 && (
                <IconWithBadge icon={Image} count={session.imageCount} label={`${session.imageCount} images`} />
              )}
              {session.customCommandCount !== undefined && session.customCommandCount > 0 && (
                <IconWithBadge
                  icon={Terminal}
                  count={session.customCommandCount}
                  label={`${session.customCommandCount} custom commands`}
                />
              )}
              {session.filesOrFoldersCount !== undefined && session.filesOrFoldersCount > 0 && (
                <IconWithBadge
                  icon={FileText}
                  count={session.filesOrFoldersCount}
                  label={`${session.filesOrFoldersCount} files/folders`}
                />
              )}
            </>
          )}
        </div>

        {displaySettings.showTokenPercentage && session.tokenPercentage !== undefined && (
          <span className={getTokenColor(session.tokenPercentage)}>{session.tokenPercentage}%</span>
        )}
      </div>
    </button>
  );
};
