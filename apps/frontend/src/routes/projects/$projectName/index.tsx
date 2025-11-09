import { createFileRoute, redirect } from '@tanstack/react-router';
import { useGetApiProjects, useGetApiSettings, useInfinitySessions } from '@/api';
import { Layout } from '@/components/layout/Layout';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { SessionsSidebar } from '@/features/projects/components/sessions-sidebar/SessionsSidebar';

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

  const { data: projects } = useGetApiProjects();
  const { data: settings } = useGetApiSettings();

  const sortBy = urlSortBy || (settings?.sessions?.groupBy === 'token-percentage' ? 'token-percentage' : 'date');
  const isSettingsLoaded = !!settings;

  const {
    data: sessionsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfinitySessions(projectName, sessionSearch || '', sortBy, isSettingsLoaded);

  const sessions = sessionsData?.pages.flatMap((page) => page.items) || [];
  const totalSessions = sessionsData?.pages[0]?.meta.totalItems || 0;
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
  const handleLabelToggle = () => {};

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
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
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
