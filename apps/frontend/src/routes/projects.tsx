import { createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { EmptyState } from '../components/projects/EmptyState';
import { ProjectsContent } from '../components/projects/ProjectsContent';
import { ProjectsSidebar } from '../components/projects/ProjectsSidebar';
import { SessionsSidebar } from '../components/sessions/SessionsSidebar';
import { useMessageFilter } from '../hooks/use-message-filter';
import { useModalState } from '../hooks/use-modal-state';
import { useNavigationManager } from '../hooks/use-navigation-manager';
import { useProjects } from '../hooks/use-projects';
import { useScrollPersistence } from '../hooks/use-scroll-persistence';
import { useSessionData } from '../hooks/use-session-data';
import { useSessions } from '../hooks/use-sessions';
import { useFilterStore } from '../stores/filter-store';

export const Route = createFileRoute('/projects')({
  component: ProjectsComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    project: (search.project as string) || undefined,
    sessionId: (search.sessionId as string) || undefined,
    imageIndex: (search.imageIndex as number) || undefined,
    folderPath: (search.folderPath as string) || undefined,
    filePath: (search.filePath as string) || undefined,
    search: (search.search as string) || undefined
  })
});

function ProjectsComponent() {
  const {
    project: selectedProject,
    sessionId,
    imageIndex,
    folderPath: urlFolderPath,
    filePath: urlFilePath,
    search: searchQuery
  } = Route.useSearch();
  const { showUserMessages, showAssistantMessages, showToolCalls } = useFilterStore();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useSessions(selectedProject || '', searchQuery || '');
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError
  } = useSessionData(selectedProject || '', sessionId || '');

  const sessions = sessionsData?.pages.flatMap((page) => page.items) || [];
  const totalSessions = sessionsData?.pages[0]?.meta.totalItems || 0;
  const selectedProjectData = projects?.find((p) => p.id === selectedProject);
  const currentSession = sessions?.find((s) => s.id === sessionId);

  const { imageModalIndex, setImageModalIndex, fileModalPath, setFileModalPath, folderModalPath, setFolderModalPath } =
    useModalState(imageIndex, urlFolderPath, urlFilePath, sessionData?.images);

  const { updateSearch, handlePathClick, navigateToProject, navigateToSession, navigateBack } = useNavigationManager({
    selectedProject,
    sessionId,
    imageIndex,
    folderPath: urlFolderPath,
    filePath: urlFilePath,
    searchQuery
  });

  useScrollPersistence(contentRef, selectedProject, sessionId);

  const { filteredMessages, searchMatches, searchMatchIndex, handleNextMatch, handlePreviousMatch } = useMessageFilter(
    sessionData?.messages || [],
    showUserMessages,
    showAssistantMessages,
    showToolCalls,
    searchQuery
  );

  if (!selectedProject) {
    return (
      <Layout
        sidebar={
          <ProjectsSidebar
            projects={projects}
            isLoading={projectsLoading}
            error={projectsError}
            onSelectProject={navigateToProject}
          />
        }
      >
        <EmptyState message="Select a project to view sessions" />
      </Layout>
    );
  }

  const sessionsSidebar = (
    <SessionsSidebar
      sessions={sessions}
      isLoading={sessionsLoading}
      error={sessionsError}
      projectName={selectedProjectData?.name || selectedProject}
      selectedSessionId={sessionId}
      totalSessions={totalSessions}
      searchValue={searchQuery}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
      onSearchChange={(value) => updateSearch({ search: value })}
      onBack={navigateBack}
      onSelectSession={navigateToSession}
      projectId={selectedProjectData?.id || selectedProject}
      isGitRepo={selectedProjectData?.isGitRepo}
    />
  );

  if (!sessionId) {
    return (
      <Layout sidebar={sessionsSidebar}>
        <EmptyState message="Select a session to view messages" />
      </Layout>
    );
  }

  let content: ReactNode;
  if (sessionError) {
    content = <EmptyState message="Failed to load session" isError />;
  } else if (sessionLoading || !sessionData) {
    content = <EmptyState message="Loading session..." />;
  } else {
    content = (
      <ProjectsContent
        contentRef={contentRef}
        currentSession={currentSession}
        filteredMessages={filteredMessages}
        searchQuery={searchQuery}
        searchMatches={searchMatches}
        searchMatchIndex={searchMatchIndex}
        imageModalIndex={imageModalIndex}
        fileModalPath={fileModalPath}
        folderModalPath={folderModalPath}
        selectedProject={selectedProject}
        sessionId={sessionId}
        sessionData={sessionData}
        onNextMatch={handleNextMatch}
        onPreviousMatch={handlePreviousMatch}
        onCloseSearch={() => updateSearch({ search: undefined })}
        onImageClick={(index: number) => {
          setImageModalIndex(index);
          updateSearch({ imageIndex: index });
        }}
        onPathClick={(path: string) => handlePathClick(path, folderModalPath, setFileModalPath, setFolderModalPath)}
        onImageModalClose={() => {
          setImageModalIndex(null);
          updateSearch({});
        }}
        onImageModalNext={() => {
          if (!sessionData) return;
          const currentIdx = sessionData.images.findIndex((img) => img.index === imageModalIndex);
          const nextIndex = sessionData.images[(currentIdx + 1) % sessionData.images.length].index;
          setImageModalIndex(nextIndex);
          updateSearch({ imageIndex: nextIndex });
        }}
        onImageModalPrev={() => {
          if (!sessionData) return;
          const currentIdx = sessionData.images.findIndex((img) => img.index === imageModalIndex);
          const prevIndex =
            sessionData.images[(currentIdx - 1 + sessionData.images.length) % sessionData.images.length].index;
          setImageModalIndex(prevIndex);
          updateSearch({ imageIndex: prevIndex });
        }}
        onFileModalClose={() => {
          setFileModalPath(null);
          updateSearch({ folderPath: folderModalPath || undefined });
        }}
        onFolderModalClose={() => {
          setFolderModalPath(null);
          updateSearch({});
        }}
        onFolderModalFileClick={(path: string) => {
          setFileModalPath(path);
          updateSearch({ filePath: path, folderPath: folderModalPath || undefined });
        }}
        onFolderModalFolderClick={(path: string) => {
          setFolderModalPath(path);
          updateSearch({ folderPath: path });
        }}
      />
    );
  }

  return <Layout sidebar={sessionsSidebar}>{content}</Layout>;
}
