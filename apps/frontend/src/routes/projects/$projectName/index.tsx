import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  getGetApiSessionsProjectNameQueryKey,
  useGetApiProjects,
  useGetApiSessionsProjectName,
  usePostApiSessionsProjectNameSessionIdLabels
} from '@/api';
import { Layout } from '@/components/layout/Layout';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { SessionsSidebar } from '@/features/projects/components/sessions-sidebar/SessionsSidebar';
import { useProjectSessionUIStore } from '@/stores/project-session-ui-store';

type SessionsSearchParams = {
  projectSearch?: string;
  sessionSearch?: string;
  sortBy?: 'date' | 'token-percentage';
};

export const Route = createFileRoute('/projects/$projectName/')({
  component: SessionsListComponent,
  validateSearch: (search: Record<string, unknown>): SessionsSearchParams => ({
    projectSearch: (search.projectSearch as string) || undefined,
    sessionSearch: (search.sessionSearch as string) || undefined,
    sortBy: (search.sortBy as 'date' | 'token-percentage') || undefined
  }),
  beforeLoad: ({ params }) => {
    if (params.projectName.includes('/sessions/')) {
      throw redirect({
        to: '/projects/$projectName',
        params: { projectName: params.projectName.split('/sessions/')[0] }
      });
    }
  }
});

function SessionsListComponent() {
  const { projectName } = Route.useParams();
  const { projectSearch, sessionSearch, sortBy: urlSortBy } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const groupBy = useProjectSessionUIStore((state) => state.groupBy);
  const hasHydrated = useProjectSessionUIStore((state) => state._hasHydrated);

  const { data: projectsData } = useGetApiProjects();
  const projects = projectsData && !('groups' in projectsData) ? projectsData : undefined;
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
    { groupBy, search: sessionSearch || undefined },
    {
      query: {
        enabled: hasHydrated,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData
      }
    }
  );

  const sessions = groupedData?.groups || [];
  const totalSessions = groupedData?.meta.totalItems || 0;
  const selectedProjectData = projects?.find((p) => p.id === projectName);

  const handleSearchChange = (value: string) => {
    navigate({ search: (prev) => ({ ...prev, sessionSearch: value || undefined }) });
  };

  const handleBack = () => {
    navigate({ to: '/projects', search: { projectSearch } });
  };

  const handleSelectSession = (sessionId: string) => {
    navigate({
      to: '/projects/$projectName/sessions/$sessionId',
      params: { projectName, sessionId },
      search: { projectSearch, sessionSearch, sortBy: urlSortBy }
    });
  };

  const handleDeleteSession = () => {};

  const handleLabelToggle = (sessionId: string, labelId: string) => {
    if (!projectName) return;
    toggleLabel({ projectName, sessionId, data: { labelId } });
  };

  const handleSortByChange = (newSortBy: 'date' | 'token-percentage') => {
    navigate({ search: (prev) => ({ ...prev, sortBy: newSortBy }) });
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
          onSortByChange={handleSortByChange}
        />
      }
    >
      <EmptyState message="Select a session to view messages" />
    </Layout>
  );
}
