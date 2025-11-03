import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
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
import { useSessionsStore } from '../stores/sessions-store';

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
  const { settings } = useSessionsStore();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortBy = settings?.groupBy === 'token-percentage' ? 'token-percentage' : 'date';

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useSessions(selectedProject || '', searchQuery || '', sortBy);
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

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sessions/${selectedProject}/${sessionToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete session');

      await queryClient.invalidateQueries({ queryKey: ['sessions', selectedProject] });
      setDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteModal = () => (
    <ConfirmDialog
      open={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
      }}
      onConfirm={confirmDeleteSession}
      title="Delete Session"
      description="Are you sure you want to delete this session? This action cannot be undone and all messages will be permanently removed."
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
      isLoading={isDeleting}
    />
  );

  if (!selectedProject) {
    return (
      <>
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
        {renderDeleteModal()}
      </>
    );
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteModalOpen(true);
  };

  const handleLabelToggle = async (sessionId: string, labelId: string) => {
    try {
      const response = await fetch(`/api/sessions/${selectedProject}/${sessionId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId })
      });

      if (!response.ok) throw new Error('Failed to toggle label');

      await queryClient.invalidateQueries({ queryKey: ['sessions', selectedProject] });
    } catch (error) {
      console.error('Failed to toggle label:', error);
      alert('Failed to toggle label');
    }
  };

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
      onDeleteSession={handleDeleteSession}
      onLabelToggle={handleLabelToggle}
      projectId={selectedProjectData?.id || selectedProject}
      isGitRepo={selectedProjectData?.isGitRepo}
    />
  );

  if (!sessionId) {
    return (
      <>
        <Layout sidebar={sessionsSidebar}>
          <EmptyState message="Select a session to view messages" />
        </Layout>
        {renderDeleteModal()}
      </>
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

  return (
    <>
      <Layout sidebar={sessionsSidebar}>{content}</Layout>
      {renderDeleteModal()}
    </>
  );
}
