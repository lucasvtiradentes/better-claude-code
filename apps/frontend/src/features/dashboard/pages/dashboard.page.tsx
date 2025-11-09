import { useGetApiProjects } from '@/api';
import { Layout } from '@/common/components/layout/Layout';

export function DashboardPage() {
  const { data: projectsData, isLoading, error } = useGetApiProjects();
  const projects = projectsData && !('groups' in projectsData) ? projectsData : [];

  const totalProjects = projects.length;
  const totalSessions = projects.reduce((sum, project) => sum + project.sessionsCount, 0);

  return (
    <Layout>
      <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">Welcome</div>
      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Failed to load projects</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            <div className="bg-card border border-border rounded-md p-6">
              <div className="text-xs text-muted-foreground uppercase mb-3 font-semibold">Total Projects</div>
              <div className="text-5xl font-semibold text-foreground">{isLoading ? '...' : totalProjects}</div>
            </div>
            <div className="bg-card border border-border rounded-md p-6">
              <div className="text-xs text-muted-foreground uppercase mb-3 font-semibold">Total Sessions</div>
              <div className="text-5xl font-semibold text-foreground">{isLoading ? '...' : totalSessions}</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
