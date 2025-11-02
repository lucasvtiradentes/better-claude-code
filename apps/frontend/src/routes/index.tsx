import { createFileRoute } from '@tanstack/react-router';
import { useRepositories } from '../hooks/use-repositories';

export const Route = createFileRoute('/')({
  component: DashboardComponent
});

function DashboardComponent() {
  const { data: repos, isLoading, error } = useRepositories();

  const totalFolders = repos?.length || 0;
  const totalSessions = repos?.reduce((sum, repo) => sum + repo.sessionsCount, 0) || 0;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-red-500">Failed to load repositories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-text-secondary mb-2">Total Folders</h2>
          <p className="text-4xl font-bold text-text-accent">
            {isLoading ? '...' : totalFolders}
          </p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-text-secondary mb-2">Total Sessions</h2>
          <p className="text-4xl font-bold text-text-accent">
            {isLoading ? '...' : totalSessions}
          </p>
        </div>
      </div>
    </div>
  );
}
