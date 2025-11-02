import { createFileRoute } from '@tanstack/react-router';
import { Layout } from '../components/layout/Layout';
import { useProjects } from '../hooks/use-projects';

export const Route = createFileRoute('/')({
  component: DashboardComponent
});

function DashboardComponent() {
  const { data: projects, isLoading, error } = useProjects();

  const totalProjects = projects?.length || 0;
  const totalSessions = projects?.reduce((sum, project) => sum + project.sessionsCount, 0) || 0;

  return (
    <Layout>
      <div className="p-4 border-b border-[#3e3e42] font-semibold text-sm flex items-center justify-between">
        Welcome
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Failed to load projects</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            <div className="bg-[#252526] border border-[#3e3e42] rounded-md p-6">
              <div className="text-xs text-[#858585] uppercase mb-3 font-semibold">Total Projects</div>
              <div className="text-5xl font-semibold text-[#d4d4d4]">{isLoading ? '...' : totalProjects}</div>
            </div>
            <div className="bg-[#252526] border border-[#3e3e42] rounded-md p-6">
              <div className="text-xs text-[#858585] uppercase mb-3 font-semibold">Total Sessions</div>
              <div className="text-5xl font-semibold text-[#d4d4d4]">{isLoading ? '...' : totalSessions}</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
