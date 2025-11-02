import type { Repository } from '@bcc/shared';
import { TIME_GROUP_LABELS, TIME_GROUP_ORDER } from '@bcc/shared';
import { MiddleSidebar } from '../layout/MiddleSidebar';
import { TimeGroup } from '../TimeGroup';
import { RepositoryCard } from './RepositoryCard';

type RepositoriesSidebarProps = {
  repos: Repository[] | undefined;
  groupedRepos: Record<string, Repository[]> | undefined;
  isLoading: boolean;
  error: unknown;
  onSelectRepo: (repoName: string) => void;
};

export const RepositoriesSidebar = ({
  repos,
  groupedRepos,
  isLoading,
  error,
  onSelectRepo
}: RepositoriesSidebarProps) => {
  return (
    <MiddleSidebar title={`Repositories (${repos?.length || 0})`}>
      {error ? (
        <div className="p-4 text-red-500">Failed to load repositories</div>
      ) : isLoading ? (
        <div className="p-4 text-[#858585]">Loading repositories...</div>
      ) : (
        TIME_GROUP_ORDER.map((timeGroup) => {
          const groupRepos = groupedRepos?.[timeGroup];
          if (!groupRepos?.length) return null;

          return (
            <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]} groupKey={timeGroup}>
              {groupRepos.map((repo) => (
                <RepositoryCard key={repo.id} repository={repo} onClick={() => onSelectRepo(repo.id)} />
              ))}
            </TimeGroup>
          );
        })
      )}
    </MiddleSidebar>
  );
};
