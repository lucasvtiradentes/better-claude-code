import { getTimeGroup } from '@bcc/shared';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { RepositoriesSidebar } from '../components/repositories/RepositoriesSidebar';
import { SessionsSidebar } from '../components/sessions/SessionsSidebar';
import { useRepositories } from '../hooks/use-repositories';
import { useSessions } from '../hooks/use-sessions';

export const Route = createFileRoute('/repositories')({
  component: RepositoriesComponent
});

function RepositoriesComponent() {
  const navigate = useNavigate();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const { data: repos, isLoading: reposLoading, error: reposError } = useRepositories();
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useSessions(selectedRepo || '');

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

  const sidebar = !selectedRepo ? (
    <RepositoriesSidebar
      repos={repos}
      groupedRepos={groupedRepos}
      isLoading={reposLoading}
      error={reposError}
      onSelectRepo={setSelectedRepo}
    />
  ) : (
    <SessionsSidebar
      sessions={sessions}
      groupedSessions={groupedSessions}
      isLoading={sessionsLoading}
      error={sessionsError}
      repoName={selectedRepo}
      onBack={() => setSelectedRepo(null)}
      onSelectSession={(sessionId) =>
        navigate({
          to: '/repositories/$repoName/$sessionId',
          params: { repoName: selectedRepo, sessionId }
        })
      }
    />
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="flex items-center justify-center h-full text-[#858585] text-sm">
        {!selectedRepo ? 'Select a repository to view sessions' : 'Select a session to view messages'}
      </div>
    </Layout>
  );
}
