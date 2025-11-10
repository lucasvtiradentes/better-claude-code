import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
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
import { SessionsSidebar } from '@/features/project-sessions/components/sessions-sidebar/SessionsSidebar';
import { EmptyState } from '@/features/projects/components/EmptyState';

type SessionsListPageProps = {
  projectName: string;
};

export function SessionsListPage({ projectName }: SessionsListPageProps) {
  const navigate = useNavigate({ from: '/projects/$projectName' });
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

  const handleLabelToggle = useCallback(
    (sessionId: string, labelId: string) => {
      if (!projectName) return;
      toggleLabel({ projectName, sessionId, data: { labelId } });
    },
    [projectName, toggleLabel]
  );

  const sidebarProps = useMemo(
    () => ({
      sessions,
      isLoading,
      error,
      projectName: selectedProjectData?.name || projectName,
      projectPath: selectedProjectData?.path || '',
      selectedSessionId: undefined,
      totalSessions,
      searchValue: sessionSearch,
      onSearchChange: setSessionSearch,
      onBack: () => navigate({ to: '/projects' }),
      onSelectSession: (sessionId: string) =>
        navigate({
          to: '/projects/$projectName/sessions/$sessionId',
          params: { projectName, sessionId }
        }),
      onDeleteSession: () => {},
      onLabelToggle: handleLabelToggle,
      projectId: projectName,
      isGitRepo: selectedProjectData?.isGitRepo
    }),
    [
      sessions,
      isLoading,
      error,
      selectedProjectData,
      projectName,
      totalSessions,
      sessionSearch,
      setSessionSearch,
      navigate,
      handleLabelToggle
    ]
  );

  return (
    <Layout sidebar={<SessionsSidebar {...sidebarProps} />}>
      <EmptyState message="Select a session to view messages" />
    </Layout>
  );
}
