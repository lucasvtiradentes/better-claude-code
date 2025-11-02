import type { Repository } from '@bcc/shared';

type RepositoryCardProps = {
  repository: Repository;
  onClick: () => void;
  isActive?: boolean;
};

export const RepositoryCard = ({ repository, onClick, isActive }: RepositoryCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left mx-8 py-3 cursor-pointer
        border-b border-[#2d2d30] transition-all duration-100
        hover:bg-[#2a2d2e]
        ${isActive ? 'bg-[#094771]' : ''}
      `}
    >
      <div className="text-sm font-semibold mb-1 break-words line-clamp-2">{repository.name}</div>
      <div className="text-[11px] text-[#858585] mb-1.5 break-all font-[Courier_New,monospace]">{repository.path}</div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#858585]">
        <span>{repository.sessionsCount} sessions</span>
        {repository.isGitRepo && (
          <span className="bg-[#0e639c] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase">
            Git Repo
          </span>
        )}
      </div>
    </button>
  );
};
