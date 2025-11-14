import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useGetApiProjects } from '@/api';
import { Layout } from '@/common/components/layout/Layout';
import { useProjectUIStore } from '@/common/stores/project-ui-store';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar/ProjectsSidebar';

type ProjectsListPageProps = {
  skipCache?: boolean;
};

export function ProjectsListPage({ skipCache }: ProjectsListPageProps) {
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
    { groupBy, search: projectSearch || undefined, skipCache: skipCache || undefined },
    {
      query: {
        enabled: hasHydrated,
        placeholderData: (previousData) => previousData
      }
    }
  );

  const isGroupedResponse = projectsData && 'groups' in projectsData;
  const projects = isGroupedResponse ? undefined : projectsData;
  const groupedProjects = isGroupedResponse ? projectsData.groups : undefined;
  const totalCount = isGroupedResponse ? projectsData.meta?.totalItems : undefined;

  const handleSelectProject = useCallback(
    (projectId: string) => {
      navigate({
        to: '/projects/$projectName',
        params: { projectName: projectId },
        search: skipCache ? { skipCache: true } : undefined
      });
    },
    [navigate, skipCache]
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
          totalCount={totalCount}
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
