import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar/ProjectsSidebar';
import { SessionsSidebar } from '@/features/projects/components/sessions-sidebar/SessionsSidebar';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePathValidation } from '../../../api/use-path-validation';
import { useProjects } from '../../../api/use-projects';
import { useDeleteSession, useToggleSessionLabel } from '../../../api/use-session-actions';
import { useSessionData } from '../../../api/use-session-data';
import { useSessions } from '../../../api/use-sessions';
import { useSettings } from '../../../api/use-settings';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Layout } from '../../../components/layout/Layout';
import { EmptyState } from '../../../features/projects/components/EmptyState';
import { ProjectsContent } from '../../../features/projects/components/ProjectsContent';
import { useMessageFilter } from '../../../hooks/use-message-filter';
import { useModalState } from '../../../hooks/use-modal-state';
import { useNavigationManager } from '../../../hooks/use-navigation-manager';
import { useScrollPersistence } from '../../../hooks/use-scroll-persistence';
import { useFilterStore } from '../../../stores/filter-store';

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
  const { data: settingsData } = useSettings();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const { mutate: deleteSessionMutation, isPending: isDeleting } = useDeleteSession();
  const { mutate: toggleLabel } = useToggleSessionLabel();

  const settings = settingsData?.sessions;
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
  const { data: pathValidation, isLoading: pathValidationLoading } = usePathValidation(
    selectedProject || '',
    sessionId || ''
  );

  const sessions = sessionsData?.pages.flatMap((page) => page.items) || [];
  const totalSessions = sessionsData?.pages[0]?.meta.totalItems || 0;
  const selectedProjectData = projects?.find((p) => p.id === selectedProject);
  const currentSession = sessions?.find((s) => s.id === sessionId);

  const { imageModalIndex, setImageModalIndex, fileModalPath, setFileModalPath, folderModalPath, setFolderModalPath } =
    useModalState(imageIndex, urlFolderPath, urlFilePath, sessionData?.images);

  console.log('[projects.tsx] State:', {
    imageIndex,
    imageModalIndex,
    sessionDataImages: sessionData?.images,
    sessionDataImagesLength: sessionData?.images?.length
  });

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

  const confirmDeleteSession = () => {
    if (!sessionToDelete || !selectedProject) return;

    deleteSessionMutation(
      { projectId: selectedProject, sessionId: sessionToDelete },
      {
        onSuccess: async () => {
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

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteModalOpen(true);
  };

  const handleLabelToggle = (sessionId: string, labelId: string) => {
    if (!selectedProject) return;

    toggleLabel(
      { projectId: selectedProject, sessionId, labelId },
      {
        onError: (error) => {
          console.error('Failed to toggle label:', error);
          alert('Failed to toggle label');
        }
      }
    );
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
      <Layout sidebar={sessionsSidebar}>
        <EmptyState message="Select a session to view messages" />
      </Layout>
    );
  }

  let content: ReactNode;
  if (sessionError) {
    content = <EmptyState message="Failed to load session" isError />;
  } else if (sessionLoading || !sessionData || pathValidationLoading) {
    content = <EmptyState message="Loading session..." />;
  } else {
    content = (
      <ProjectsContent
        contentRef={contentRef}
        currentSession={currentSession}
        filteredMessages={filteredMessages}
        pathValidation={pathValidation}
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
          console.log('[projects.tsx] onImageClick called with index:', index);
          console.log('[projects.tsx] sessionData.images:', sessionData?.images);
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
    </>
  );
}
