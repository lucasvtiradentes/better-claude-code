import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useGetApiProjects } from '@/api';
import { Layout } from '@/components/layout/Layout';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar/ProjectsSidebar';

type ProjectsSearchParams = {
  projectSearch?: string;
};

export const Route = createFileRoute('/projects/')({
  component: ProjectsListComponent,
  validateSearch: (search: Record<string, unknown>): ProjectsSearchParams => ({
    projectSearch: (search.projectSearch as string) || undefined
  })
});

function ProjectsListComponent() {
  const navigate = Route.useNavigate();
  const { projectSearch } = Route.useSearch();
  const { data: projects, isLoading, error } = useGetApiProjects();

  const handleSelectProject = useCallback(
    (projectId: string) => {
      navigate({ to: '/projects/$projectName', params: { projectName: projectId }, search: { projectSearch } });
    },
    [navigate, projectSearch]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      navigate({ search: { projectSearch: value || undefined } });
    },
    [navigate]
  );

  return (
    <Layout
      sidebar={
        <ProjectsSidebar
          projects={projects}
          isLoading={isLoading}
          error={error}
          searchValue={projectSearch}
          onSearchChange={handleSearchChange}
          onSelectProject={handleSelectProject}
        />
      }
    >
      <EmptyState message="Select a project to view sessions" />
    </Layout>
  );
}
