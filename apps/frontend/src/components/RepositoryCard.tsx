import type { Repository } from '@bcc/shared';

type RepositoryCardProps = {
  repository: Repository;
  onClick: () => void;
};

export const RepositoryCard = ({ repository, onClick }: RepositoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-surface hover:bg-surface/80 rounded-lg border border-border p-4 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-text-primary font-medium">{repository.name}</span>
          {repository.isGitRepo && (
            <span className="px-2 py-0.5 text-xs bg-text-accent/20 text-text-accent rounded">
              Git
            </span>
          )}
        </div>
        <span className="text-text-secondary text-sm">{repository.sessionsCount} sessions</span>
      </div>
    </button>
  );
};
