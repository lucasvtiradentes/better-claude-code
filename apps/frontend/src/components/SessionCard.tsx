import type { Session } from '@bcc/shared';

type SessionCardProps = {
  session: Session;
  repoName: string;
  onClick: () => void;
};

export const SessionCard = ({ session, onClick }: SessionCardProps) => {
  const getTokenColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-text-secondary';
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-surface hover:bg-surface/80 rounded-lg border border-border p-4 text-left transition-colors"
    >
      <div className="space-y-2">
        <h4 className="text-text-primary font-medium line-clamp-2">{session.title}</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{session.messageCount} messages</span>
          {session.tokenUsage && (
            <span className={getTokenColor(session.tokenUsage.percentage)}>
              {session.tokenUsage.percentage}% tokens
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
