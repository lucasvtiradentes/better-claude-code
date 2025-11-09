import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useGetApiProjects } from '@/api';
import { Layout } from '@/common/components/layout/Layout';
import { useProjectUIStore } from '@/common/stores/project-ui-store';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar/ProjectsSidebar';

export function ProjectsListPage() {
  const navigate = useNavigate({ from: '/projects/' });
  const projectSearch = useProjectUIStore((state) => state.search);
  const setProjectSearch = useProjectUIStore((state) => state.setSearch);
  const groupBy = useProjectUIStore((state) => state.groupBy);
  const hasHydrated = useProjectUIStore((state) => state._hasHydrated);

  const {
    data: projectsData,
    isLoading,
    error
  } = useGetApiProjects(
    { groupBy, search: projectSearch || undefined },
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
      navigate({ to: '/projects/$projectName', params: { projectName: projectId } });
    },
    [navigate]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setProjectSearch(value);
    },
    [setProjectSearch]
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
