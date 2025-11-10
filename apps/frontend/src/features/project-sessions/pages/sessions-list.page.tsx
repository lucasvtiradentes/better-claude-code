import { UseNavigateResult } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  getGetApiSessionsProjectNameQueryKey,
  useGetApiProjects,
  useGetApiSessionsProjectName,
  usePostApiSessionsProjectNameSessionIdLabels
} from '@/api';
import { Layout } from '@/common/components/layout/Layout';
import { queryClient } from '@/common/lib/tanstack-query';
import { useProjectSessionUIStore } from '@/common/stores/project-session-ui-store';
import { useProjectUIStore } from '@/common/stores/project-ui-store';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { SessionsSidebar } from '@/features/projects/components/sessions-sidebar/SessionsSidebar';

interface SessionsListPageProps {
  projectName: string;
  navigate: UseNavigateResult<string>;
}

export function SessionsListPage({ projectName, navigate }: SessionsListPageProps) {
  const sessionSearch = useProjectSessionUIStore((state) => state.search);
  const setSessionSearch = useProjectSessionUIStore((state) => state.setSearch);
  const sessionGroupBy = useProjectSessionUIStore((state) => state.groupBy);
  const sessionHasHydrated = useProjectSessionUIStore((state) => state._hasHydrated);
  const projectGroupBy = useProjectUIStore((state) => state.groupBy);
  const projectHasHydrated = useProjectUIStore((state) => state._hasHydrated);

  const { data: projectsData } = useGetApiProjects(
    { groupBy: projectGroupBy, search: undefined },
    {
      query: {
        enabled: projectHasHydrated
      }
    }
  );
  const projects = projectsData && 'groups' in projectsData ? projectsData.groups.flatMap((g) => g.items) : undefined;
  const { mutate: toggleLabel } = usePostApiSessionsProjectNameSessionIdLabels({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: getGetApiSessionsProjectNameQueryKey(variables.projectName)
        });
      },
      onError: (error) => {
        console.error('Failed to toggle label:', error);
        toast.error('Failed to toggle label');
      }
    }
  });

  const {
    data: groupedData,
    isLoading,
    error
  } = useGetApiSessionsProjectName(
    projectName,
    { groupBy: sessionGroupBy, search: sessionSearch || undefined },
    {
      query: {
        enabled: sessionHasHydrated,
        placeholderData: (previousData) => previousData
      }
    }
  );

  const sessions = groupedData?.groups || [];
  const totalSessions = groupedData?.meta.totalItems || 0;
  const selectedProjectData = projects?.find((p) => p.id === projectName);

  const handleSearchChange = (value: string) => {
    setSessionSearch(value);
  };

  const handleBack = () => {
    navigate({ to: '/projects' });
  };

  const handleSelectSession = (sessionId: string) => {
    navigate({
      to: '/projects/$projectName/sessions/$sessionId',
      params: { projectName, sessionId }
    });
  };

  const handleDeleteSession = () => {};

  const handleLabelToggle = (sessionId: string, labelId: string) => {
    if (!projectName) return;
    toggleLabel({ projectName, sessionId, data: { labelId } });
  };

  return (
    <Layout
      sidebar={
        <SessionsSidebar
          sessions={sessions}
          isLoading={isLoading}
          error={error}
          projectName={selectedProjectData?.name || projectName}
          projectPath={selectedProjectData?.path || ''}
          selectedSessionId={undefined}
          totalSessions={totalSessions}
          searchValue={sessionSearch}
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadMore={() => {}}
          onSearchChange={handleSearchChange}
          onBack={handleBack}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onLabelToggle={handleLabelToggle}
          projectId={projectName}
          isGitRepo={selectedProjectData?.isGitRepo}
        />
      }
    >
      <EmptyState message="Select a session to view messages" />
    </Layout>
  );
}
