import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  useDeleteApiSessionsProjectNameSessionId,
  useGetApiProjects,
  useGetApiSessionsProjectNameSessionId,
  useInfinitySessions,
  usePostApiSessionsProjectNameSessionIdLabels
} from '@/api';
import { useClaudeStream } from '@/features/live-sessions/hooks/useClaudeStream';
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar/ProjectsSidebar';
import { SessionsSidebar } from '@/features/projects/components/sessions-sidebar/SessionsSidebar';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Layout } from '../../../components/layout/Layout';
import { EmptyState } from '../../../features/projects/components/EmptyState';
import { ProjectsContent } from '../../../features/projects/components/ProjectsContent';
import { useMessageFilter } from '../hooks/use-message-filter';
import { useModalState } from '../hooks/use-modal-state';
import { useNavigationManager } from '../hooks/use-navigation-manager';
import { useScrollPersistence } from '../hooks/use-scroll-persistence';
import { useFilterStore } from '../stores/filter-store';

export type ProjectsSearchParams = {
  project?: string;
  sessionId?: string;
  imageIndex?: number;
  folderPath?: string;
  filePath?: string;
  search?: string;
};

type ProjectsPageProps = {
  searchParams: ProjectsSearchParams;
};

export function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const {
    project: selectedProject,
    sessionId,
    imageIndex,
    folderPath: urlFolderPath,
    filePath: urlFilePath,
    search: searchQuery
  } = searchParams;
  const { showUserMessages, showAssistantMessages, showToolCalls } = useFilterStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const { mutate: deleteSessionMutation, isPending: isDeleting } = useDeleteApiSessionsProjectNameSessionId();
  const { mutate: toggleLabel } = usePostApiSessionsProjectNameSessionIdLabels();
  const [sortBy, setSortBy] = useState<'date' | 'token-percentage'>('date');

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useGetApiProjects();
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfinitySessions(selectedProject || '', searchQuery || '', sortBy);
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError
  } = useGetApiSessionsProjectNameSessionId(selectedProject || '', sessionId || '', {
    query: { enabled: !!(selectedProject && sessionId) }
  });

  const sessions = sessionsData?.pages.flatMap((page) => page.items) || [];
  const totalSessions = sessionsData?.pages[0]?.meta.totalItems || 0;
  const selectedProjectData = projects?.find((p) => p.id === selectedProject);
  const currentSession = sessions?.find((s) => s.id === sessionId);

  const shouldEnableStream = !!(sessionId && selectedProjectData?.path && selectedProjectData?.name);

  const {
    messages: liveMessages,
    status: streamStatus,
    sendMessage
  } = useClaudeStream(
    sessionId || 'placeholder',
    selectedProjectData?.path || 'placeholder',
    selectedProjectData?.name || 'placeholder',
    shouldEnableStream
  );

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

  const convertedLiveMessages = liveMessages.map((msg) => ({
    type: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.getTime()
  }));

  const displayMessages = liveMessages.length > 0 ? convertedLiveMessages : sessionData?.messages || [];

  const { filteredMessages, searchMatches, searchMatchIndex, handleNextMatch, handlePreviousMatch } = useMessageFilter(
    displayMessages,
    showUserMessages,
    showAssistantMessages,
    showToolCalls,
    searchQuery
  );

  useEffect(() => {
    if (liveMessages.length > 0 && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [liveMessages]);

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setTimeout(() => {
      setDeleteModalOpen(true);
    }, 0);
  };

  const handleLabelToggle = (sessionId: string, labelId: string) => {
    if (!selectedProject) return;

    toggleLabel(
      { projectName: selectedProject, sessionId, data: { labelId } },
      {
        onError: (error) => {
          console.error('Failed to toggle label:', error);
          alert('Failed to toggle label');
        }
      }
    );
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete || !selectedProject) return;

    deleteSessionMutation(
      { projectName: selectedProject, sessionId: sessionToDelete },
      {
        onSuccess: async () => {
          queryClient.setQueryData(['sessions', selectedProject, searchQuery || '', sortBy], (oldData: any) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.filter((item: any) => item.id !== sessionToDelete),
                meta: {
                  ...page.meta,
                  totalItems: page.meta.totalItems - 1
                }
              }))
            };
          });

          if (sessionId === sessionToDelete) {
            await navigate({
              to: '/projects',
              search: {
                project: selectedProject,
                sessionId: undefined,
                imageIndex: undefined,
                folderPath: undefined,
                filePath: undefined,
                search: undefined
              }
            });
          }

          setDeleteModalOpen(false);
          setSessionToDelete(null);
          toast.success('Session deleted successfully');
        },
        onError: (error) => {
          console.error('Failed to delete session:', error);
          toast.error('Failed to delete session');
        }
      }
    );
  };

  const renderConfirmDialog = () => (
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
        {renderConfirmDialog()}
      </>
    );
  }

  const getProjectDisplayName = () => {
    if (selectedProjectData?.name) return selectedProjectData.name;
    return '...';
  };

  const sessionsSidebar = (
    <SessionsSidebar
      sessions={sessions}
      isLoading={sessionsLoading}
      error={sessionsError}
      projectName={getProjectDisplayName()}
      projectPath={selectedProjectData?.path || ''}
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
      onSortByChange={setSortBy}
    />
  );

  if (!sessionId) {
    return (
      <>
        <Layout sidebar={sessionsSidebar}>
          <EmptyState message="Select a session to view messages" />
        </Layout>
        {renderConfirmDialog()}
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
        pathValidation={sessionData.paths}
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
        onSendMessage={sendMessage}
        messageInputDisabled={streamStatus === 'streaming'}
        messageInputPlaceholder={streamStatus === 'streaming' ? 'Claude is responding...' : 'Type your message...'}
        isStreaming={streamStatus === 'streaming'}
      />
    );
  }

  return (
    <>
      <Layout sidebar={sessionsSidebar}>{content}</Layout>
      {renderConfirmDialog()}
    </>
  );
}
