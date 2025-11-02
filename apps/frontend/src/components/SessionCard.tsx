import type { Session } from '@bcc/shared';

type SessionCardProps = {
  session: Session;
  repoName: string;
  onClick: () => void;
  isActive?: boolean;
};

export const SessionCard = ({ session, onClick, isActive }: SessionCardProps) => {
  const getTokenColor = (percentage: number) => {
    if (percentage >= 80) return 'text-[#ff4444]';
    if (percentage >= 50) return 'text-[#ffa500]';
    return 'text-[#858585]';
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
        border-b border-[#2d2d30] transition-all duration-100
        hover:bg-[#2a2d2e]
        ${isActive ? 'bg-[#094771]' : ''}
      `}
    >
      <div className="text-sm font-semibold mb-1 break-words line-clamp-2">
        {titleParts.map((part, i) => (
          <span
            key={`${part.text}-${i}`}
            className={
              part.type === 'file'
                ? 'text-[#ff9800] font-semibold'
                : part.type === 'command'
                  ? 'text-[#4CAF50] font-semibold'
                  : ''
            }
          >
            {part.text}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-end text-[11px]">
        {session.tokenUsage && (
          <span className={getTokenColor(session.tokenUsage.percentage)}>{session.tokenUsage.percentage}%</span>
        )}
      </div>
    </button>
  );
};
