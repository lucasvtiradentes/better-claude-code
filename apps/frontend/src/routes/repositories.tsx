import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useRepositories } from '../hooks/use-repositories';
import { useSessions } from '../hooks/use-sessions';
import { TimeGroup } from '../components/TimeGroup';
import { RepositoryCard } from '../components/RepositoryCard';
import { SessionCard } from '../components/SessionCard';
import { getTimeGroup, TIME_GROUP_LABELS, TIME_GROUP_ORDER } from '@bcc/shared';

export const Route = createFileRoute('/repositories')({
  component: RepositoriesComponent
});

function RepositoriesComponent() {
  const navigate = useNavigate();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const { data: repos, isLoading: reposLoading, error: reposError } = useRepositories();
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError
  } = useSessions(selectedRepo || '');

  if (reposError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Repositories</h1>
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-red-500">Failed to load repositories</p>
        </div>
      </div>
    );
  }

  const groupedRepos = repos?.reduce(
    (acc, repo) => {
      const group = getTimeGroup(repo.lastModified);
      if (!acc[group]) acc[group] = [];
      acc[group].push(repo);
      return acc;
    },
    {} as Record<string, typeof repos>
  );

  const groupedSessions = sessions?.reduce(
    (acc, session) => {
      const group = getTimeGroup(session.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(session);
      return acc;
    },
    {} as Record<string, typeof sessions>
  );

  if (!selectedRepo) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Repositories</h1>

        {reposLoading ? (
          <div className="bg-surface rounded-lg border border-border p-6">
            <p className="text-text-secondary">Loading repositories...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {TIME_GROUP_ORDER.map((timeGroup) => {
              const groupRepos = groupedRepos?.[timeGroup];
              if (!groupRepos?.length) return null;

              return (
                <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]}>
                  {groupRepos.map((repo) => (
                    <RepositoryCard
                      key={repo.name}
                      repository={repo}
                      onClick={() => setSelectedRepo(repo.name)}
                    />
                  ))}
                </TimeGroup>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedRepo(null)}
          className="text-text-accent hover:text-text-accent/80 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-text-primary">{selectedRepo}</h1>
      </div>

      {sessionsError ? (
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-red-500">Failed to load sessions</p>
        </div>
      ) : sessionsLoading ? (
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-text-secondary">Loading sessions...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {TIME_GROUP_ORDER.map((timeGroup) => {
            const groupSessions = groupedSessions?.[timeGroup];
            if (!groupSessions?.length) return null;

            return (
              <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]}>
                {groupSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    repoName={selectedRepo}
                    onClick={() =>
                      navigate({
                        to: '/repositories/$repoName/$sessionId',
                        params: { repoName: selectedRepo, sessionId: session.id }
                      })
                    }
                  />
                ))}
              </TimeGroup>
            );
          })}
        </div>
      )}
    </div>
  );
}
