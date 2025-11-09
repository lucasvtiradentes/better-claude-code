import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getGetApiSessionsProjectNameSessionIdQueryOptions,
  useDeleteApiSessionsProjectNameSessionId,
  useGetApiProjects,
  useGetApiSessionsProjectNameSessionId,
  useGetApiSettings,
  useInfinitySessions,
  usePostApiSessionsProjectNameSessionIdLabels
} from '@/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Layout } from '@/components/layout/Layout';
import { useClaudeStream } from '@/features/live-sessions/hooks/useClaudeStream';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { ProjectsContent } from '@/features/projects/components/ProjectsContent';
import { SessionsSidebar } from '@/features/projects/components/sessions-sidebar/SessionsSidebar';
import { useMessageFilter } from '@/features/projects/hooks/use-message-filter';
import { useModalState } from '@/features/projects/hooks/use-modal-state';
import { useScrollPersistence } from '@/features/projects/hooks/use-scroll-persistence';
import { useFilterStore } from '@/features/projects/stores/filter-store';
import { queryClient } from '@/lib/tanstack-query';

type SessionDetailSearchParams = {
  projectSearch?: string;
  sessionSearch?: string;
  imageIndex?: number;
  folderPath?: string;
  filePath?: string;
  sortBy?: 'date' | 'token-percentage';
};

export const Route = createFileRoute('/projects/$projectName/sessions/$sessionId')({
  component: SessionDetailComponent,
  validateSearch: (search: Record<string, unknown>): SessionDetailSearchParams => ({
    projectSearch: (search.projectSearch as string) || undefined,
    sessionSearch: (search.sessionSearch as string) || undefined,
    imageIndex: (search.imageIndex as number) || undefined,
    folderPath: (search.folderPath as string) || undefined,
    filePath: (search.filePath as string) || undefined,
    sortBy: (search.sortBy as 'date' | 'token-percentage') || undefined
  }),
  loader: ({ params }) => {
    queryClient.ensureQueryData(
      getGetApiSessionsProjectNameSessionIdQueryOptions(params.projectName, params.sessionId)
    );
  }
});

function SessionDetailComponent() {
  const { projectName, sessionId } = Route.useParams();
  const {
    projectSearch,
    sessionSearch,
    imageIndex,
    folderPath: urlFolderPath,
    filePath: urlFilePath,
    sortBy: urlSortBy
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { showUserMessages, showAssistantMessages, showToolCalls } = useFilterStore();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const { mutate: deleteSessionMutation, isPending: isDeleting } = useDeleteApiSessionsProjectNameSessionId();
  const { mutate: toggleLabel } = usePostApiSessionsProjectNameSessionIdLabels();

  const { data: projects } = useGetApiProjects();
  const { data: settings } = useGetApiSettings();

  const sortBy = urlSortBy || (settings?.sessions?.groupBy === 'token-percentage' ? 'token-percentage' : 'date');
  const isSettingsLoaded = !!settings;

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfinitySessions(projectName, sessionSearch || '', sortBy, isSettingsLoaded);
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError
  } = useGetApiSessionsProjectNameSessionId(projectName, sessionId, {
    query: { enabled: !!(projectName && sessionId) }
  });

  const sessions = sessionsData?.pages.flatMap((page) => page.items) || [];
  const totalSessions = sessionsData?.pages[0]?.meta.totalItems || 0;
  const selectedProjectData = projects?.find((p) => p.id === projectName);
  const currentSession = sessions?.find((s) => s.id === sessionId);

  const shouldEnableStream = !!(sessionId && selectedProjectData?.path && selectedProjectData?.name);

  const {
    messages: liveMessages,
    images: liveImages,
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

  const updateSearch = (updates: Partial<SessionDetailSearchParams>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates
      })
    });
  };

  const handlePathClick = (
    path: string,
    currentFolderPath: string | null,
    setFile: (path: string | null) => void,
    setFolder: (path: string | null) => void
  ) => {
    const isDirectory = !path.includes('.');
    if (isDirectory) {
      setFolder(path);
      updateSearch({ folderPath: path, filePath: undefined });
    } else {
      setFile(path);
      updateSearch({ filePath: path, folderPath: currentFolderPath || undefined });
    }
  };

  useScrollPersistence(contentRef, projectName, sessionId);

  const convertedLiveMessages = liveMessages.map((msg, index) => ({
    id: msg.id || `live-${msg.timestamp.getTime()}-${index}`,
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
    sessionSearch
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
    if (!projectName) return;

    toggleLabel(
      { projectName, sessionId, data: { labelId } },
      {
        onError: (error) => {
          console.error('Failed to toggle label:', error);
          alert('Failed to toggle label');
        }
      }
    );
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete || !projectName) return;

    deleteSessionMutation(
      { projectName, sessionId: sessionToDelete },
      {
        onSuccess: async () => {
          queryClient.setQueryData(['sessions', projectName, sessionSearch || '', sortBy], (oldData: any) => {
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
              to: '/projects/$projectName',
              params: { projectName }
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

  const handleBack = () => {
    navigate({
      to: '/projects/$projectName',
      params: { projectName },
      search: { projectSearch, sessionSearch, sortBy: urlSortBy }
    });
  };

  const handleSelectSession = (newSessionId: string) => {
    navigate({
      to: '/projects/$projectName/sessions/$sessionId',
      params: { projectName, sessionId: newSessionId },
      search: { projectSearch, sessionSearch, sortBy: urlSortBy }
    });
  };

  const handleSearchChange = (value: string) => {
    updateSearch({ sessionSearch: value || undefined });
  };

  const handleSortByChange = (newSortBy: 'date' | 'token-percentage') => {
    updateSearch({ sortBy: newSortBy });
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

  let content: ReactNode;
  if (sessionError) {
    content = <EmptyState message="Failed to load session" isError />;
  } else if (sessionLoading || !sessionData) {
    content = <EmptyState message="Loading session..." />;
  } else {
    const mergedSessionData = {
      ...sessionData,
      images: [
        ...(sessionData.images || []),
        ...liveImages.map((img) => ({
          index: img.index,
          data: img.data,
          messageId: img.messageId
        }))
      ]
    };

    content = (
      <ProjectsContent
        contentRef={contentRef}
        currentSession={currentSession}
        filteredMessages={filteredMessages}
        pathValidation={sessionData.paths}
        searchQuery={sessionSearch}
        searchMatches={searchMatches}
        searchMatchIndex={searchMatchIndex}
        imageModalIndex={imageModalIndex}
        fileModalPath={fileModalPath}
        folderModalPath={folderModalPath}
        selectedProject={projectName}
        sessionId={sessionId}
        sessionData={mergedSessionData}
        onNextMatch={handleNextMatch}
        onPreviousMatch={handlePreviousMatch}
        onCloseSearch={() => updateSearch({ sessionSearch: undefined })}
        onImageClick={(arrayPosition: number) => {
          if (!sessionData) return;
          setImageModalIndex(arrayPosition);
          updateSearch({ imageIndex: arrayPosition });
        }}
        onPathClick={(path: string) => handlePathClick(path, folderModalPath, setFileModalPath, setFolderModalPath)}
        onImageModalClose={() => {
          setImageModalIndex(null);
          updateSearch({});
        }}
        onImageModalNext={() => {
          if (!sessionData || imageModalIndex === null) return;
          const nextIdx = (imageModalIndex + 1) % sessionData.images.length;
          setImageModalIndex(nextIdx);
          updateSearch({ imageIndex: nextIdx });
        }}
        onImageModalPrev={() => {
          if (!sessionData || imageModalIndex === null) return;
          const prevIdx = (imageModalIndex - 1 + sessionData.images.length) % sessionData.images.length;
          setImageModalIndex(prevIdx);
          updateSearch({ imageIndex: prevIdx });
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
      <Layout
        sidebar={
          <SessionsSidebar
            sessions={sessions}
            isLoading={sessionsLoading}
            error={sessionsError}
            projectName={selectedProjectData?.name || projectName}
            projectPath={selectedProjectData?.path || ''}
            selectedSessionId={sessionId}
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
            projectId={selectedProjectData?.id || projectName}
            isGitRepo={selectedProjectData?.isGitRepo}
            onSortByChange={handleSortByChange}
          />
        }
      >
        {content}
      </Layout>
      {renderConfirmDialog()}
    </>
  );
}
