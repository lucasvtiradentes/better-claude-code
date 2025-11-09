import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useGetApiProjects } from '@/api';
import { Layout } from '@/components/layout/Layout';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar/ProjectsSidebar';
import { useProjectUIStore } from '@/stores/project-ui-store';

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
  const groupBy = useProjectUIStore((state) => state.groupBy);
  const hasHydrated = useProjectUIStore((state) => state._hasHydrated);

  const { data: projectsData, isLoading, error } = useGetApiProjects(
    { groupBy },
    {
      query: {
        enabled: hasHydrated,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData
      }
    }
  );

  const isGroupedResponse = projectsData && 'groups' in projectsData;
  const projects = isGroupedResponse ? undefined : projectsData;
  const groupedProjects = isGroupedResponse ? projectsData.groups : undefined;

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
          groupedProjects={groupedProjects}
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
