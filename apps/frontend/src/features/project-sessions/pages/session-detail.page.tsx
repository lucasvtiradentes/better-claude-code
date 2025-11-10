import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import {
  getGetApiSessionsProjectNameQueryKey,
  useGetApiProjects,
  useGetApiSessionsProjectName,
  useGetApiSessionsProjectNameSessionId,
  usePostApiSessionsProjectNameSessionIdLabels
} from '@/api';
import { Layout } from '@/common/components/layout/Layout';
import { queryClient } from '@/common/lib/tanstack-query';
import { useProjectSessionUIStore } from '@/common/stores/project-session-ui-store';
import { useProjectUIStore } from '@/common/stores/project-ui-store';
import { useClaudeStream } from '@/features/live-sessions/hooks/useClaudeStream';
import { SessionDeleteDialog } from '@/features/project-sessions/components/session-detail/SessionDeleteDialog';
import { SessionChat } from '@/features/project-sessions/components/sessions-chat/SessionChat';
import { SessionsSidebar } from '@/features/project-sessions/components/sessions-sidebar/SessionsSidebar';
import { useSessionDelete } from '@/features/project-sessions/hooks/useSessionDelete';
import { useSessionModals } from '@/features/project-sessions/hooks/useSessionModals';
import { useSessionNavigation } from '@/features/project-sessions/hooks/useSessionNavigation';
import { useSessionPaths } from '@/features/project-sessions/hooks/useSessionPaths';
import { useSessionSidebarProps } from '@/features/project-sessions/hooks/useSessionSidebarProps';
import { EmptyState } from '@/features/projects/components/EmptyState';
import { useMessageFilter } from '@/features/projects/hooks/use-message-filter';
import { useScrollPersistence } from '@/features/projects/hooks/use-scroll-persistence';
import { useFilterStore } from '@/features/projects/stores/filter-store';

export const sessionDetailSearchSchema = z.object({
  imageIndex: z.number().optional(),
  folderPath: z.string().optional(),
  filePath: z.string().optional()
});

type SessionDetailQueryParams = z.infer<typeof sessionDetailSearchSchema>;

type SessionDetailPageProps = {
  projectName: string;
  sessionId: string;
} & SessionDetailQueryParams;

export function SessionDetailPage({
  projectName,
  sessionId,
  imageIndex,
  folderPath: urlFolderPath,
  filePath: urlFilePath
}: SessionDetailPageProps) {
  const { showUserMessages, showAssistantMessages, showToolCalls } = useFilterStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const sessionSearch = useProjectSessionUIStore((state) => state.search);
  const setSessionSearch = useProjectSessionUIStore((state) => state.setSearch);
  const sessionGroupBy = useProjectSessionUIStore((state) => state.groupBy);
  const sessionHasHydrated = useProjectSessionUIStore((state) => state._hasHydrated);
  const projectGroupBy = useProjectUIStore((state) => state.groupBy);
  const projectHasHydrated = useProjectUIStore((state) => state._hasHydrated);

  const { updateSearch, navigateToProject, navigateToSession } = useSessionNavigation(projectName);

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

  const { data: projectsData } = useGetApiProjects(
    { groupBy: projectGroupBy, search: undefined },
    {
      query: {
        enabled: projectHasHydrated
      }
    }
  );
  const projects = projectsData && 'groups' in projectsData ? projectsData.groups.flatMap((g) => g.items) : undefined;

  const {
    data: groupedData,
    isLoading: isLoadingGrouped,
    error: errorGrouped
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
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError
  } = useGetApiSessionsProjectNameSessionId(projectName, sessionId, {
    query: { enabled: !!(projectName && sessionId) }
  });

  const selectedProjectData = projects?.find((p) => p.id === projectName);
  const currentSession = sessions.flatMap((g) => g.items).find((s) => s.id === sessionId);

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
    useSessionModals(imageIndex, urlFolderPath, urlFilePath, sessionData?.images);

  const { handlePathClick } = useSessionPaths(updateSearch, setFileModalPath, setFolderModalPath);

  const { deleteModalOpen, isDeleting, openDeleteModal, closeDeleteModal, confirmDelete } = useSessionDelete(
    projectName,
    sessionId,
    sessionGroupBy,
    sessionSearch,
    navigateToProject
  );

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

  const handleLabelToggle = (sessionId: string, labelId: string) => {
    if (!projectName) return;
    toggleLabel({ projectName, sessionId, data: { labelId } });
  };

  const sidebarProps = useSessionSidebarProps({
    sessions,
    isLoadingGrouped,
    errorGrouped,
    selectedProjectData,
    projectName,
    sessionId,
    totalSessions,
    sessionSearch,
    setSessionSearch,
    navigateToProject,
    navigateToSession,
    openDeleteModal,
    handleLabelToggle
  });

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
      <SessionChat
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
        onCloseSearch={() => setSessionSearch('')}
        onImageClick={(arrayPosition: number) => {
          if (!sessionData) return;
          setImageModalIndex(arrayPosition);
          updateSearch({ imageIndex: arrayPosition });
        }}
        onPathClick={(path: string) => handlePathClick(path, folderModalPath)}
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
        onSendMessage={sendMessage}
        messageInputDisabled={streamStatus === 'streaming'}
        messageInputPlaceholder={streamStatus === 'streaming' ? 'Claude is responding...' : 'Type your message...'}
        isStreaming={streamStatus === 'streaming'}
      />
    );
  }

  return (
    <>
      <Layout sidebar={<SessionsSidebar {...sidebarProps} />}>{content}</Layout>
      <SessionDeleteDialog
        open={deleteModalOpen}
        isLoading={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}
