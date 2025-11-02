import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, Image, Search, Terminal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { IconWithBadge } from '../components/common/IconWithBadge';
import { FileModal } from '../components/FileModal';
import { FilterButtons } from '../components/FilterButtons';
import { FolderModal } from '../components/FolderModal';
import { ImageModal } from '../components/ImageModal';
import { Layout } from '../components/layout/Layout';
import { ProjectsSidebar } from '../components/projects/ProjectsSidebar';
import { SearchNavigation } from '../components/sessions/SearchNavigation';
import { SessionMessage } from '../components/sessions/SessionMessage';
import { SessionsSidebar } from '../components/sessions/SessionsSidebar';
import { useProjects } from '../hooks/use-projects';
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
  const navigate = useNavigate();
  const {
    project: selectedProject,
    sessionId,
    imageIndex,
    folderPath: urlFolderPath,
    filePath: urlFilePath,
    search: searchQuery
  } = Route.useSearch();
  const { showUserMessages, showAssistantMessages, showToolCalls } = useFilterStore();
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);
  const [folderModalPath, setFolderModalPath] = useState<string | null>(null);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
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

  const scrollKey = selectedProject && sessionId ? `scroll-${selectedProject}-${sessionId}` : '';

  useEffect(() => {
    if (!scrollKey || !contentRef.current) return;

    const savedScroll = localStorage.getItem(scrollKey);
    if (savedScroll) {
      contentRef.current.scrollTop = Number(savedScroll);
    }

    const handleScroll = () => {
      if (contentRef.current) {
        localStorage.setItem(scrollKey, String(contentRef.current.scrollTop));
      }
    };

    const ref = contentRef.current;
    ref?.addEventListener('scroll', handleScroll);
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, [scrollKey]);

  useEffect(() => {
    if (imageIndex && sessionData?.images) {
      const imageExists = sessionData.images.some((img) => img.index === imageIndex);
      if (imageExists) {
        setImageModalIndex(imageIndex);
      }
    }
  }, [imageIndex, sessionData]);

  useEffect(() => {
    if (urlFolderPath) {
      setFolderModalPath(urlFolderPath);
    }
    if (urlFilePath) {
      setFileModalPath(urlFilePath);
    }
  }, [urlFolderPath, urlFilePath]);

  const updateSearch = (updates: {
    project?: string;
    sessionId?: string;
    imageIndex?: number;
    folderPath?: string;
    filePath?: string;
    search?: string;
  }) => {
    navigate({
      to: '/projects',
      search: {
        project: selectedProject,
        sessionId,
        imageIndex: undefined,
        folderPath: undefined,
        filePath: undefined,
        search: searchQuery,
        ...updates
      }
    });
  };

  const handlePathClick = (path: string) => {
    const hasExtension = /\.[^./\\]+$/.test(path);
    if (hasExtension) {
      setFileModalPath(path);
      updateSearch({ filePath: path, folderPath: folderModalPath || undefined });
    } else {
      setFolderModalPath(path);
      updateSearch({ folderPath: path });
    }
  };

  const sidebar = !selectedProject ? (
    <ProjectsSidebar
      projects={projects}
      isLoading={projectsLoading}
      error={projectsError}
      onSelectProject={(projectId) =>
        navigate({
          to: '/projects',
          search: {
            project: projectId,
            sessionId: undefined,
            imageIndex: undefined,
            folderPath: undefined,
            filePath: undefined,
            search: undefined
          }
        })
      }
    />
  ) : (
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
      onBack={() =>
        navigate({
          to: '/projects',
          search: {
            project: undefined,
            sessionId: undefined,
            imageIndex: undefined,
            folderPath: undefined,
            filePath: undefined,
            search: undefined
          }
        })
      }
      onSelectSession={(sid) =>
        navigate({
          to: '/projects',
          search: {
            project: selectedProject,
            sessionId: sid,
            imageIndex: undefined,
            folderPath: undefined,
            filePath: undefined,
            search: searchQuery
          }
        })
      }
      projectId={selectedProjectData?.id || selectedProject}
      isGitRepo={selectedProjectData?.isGitRepo}
    />
  );

  const currentSession = sessions?.find((s) => s.id === sessionId);

  let content: ReactNode;
  if (!selectedProject) {
    content = (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a project to view sessions
      </div>
    );
  } else if (!sessionId) {
    content = (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a session to view messages
      </div>
    );
  } else if (sessionError) {
    content = (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Failed to load session</p>
      </div>
    );
  } else if (sessionLoading || !sessionData) {
    content = <div className="flex items-center justify-center h-full text-muted-foreground">Loading session...</div>;
  } else {
    let filteredMessages = sessionData.messages.filter(
      (msg) => (msg.type === 'user' && showUserMessages) || (msg.type === 'assistant' && showAssistantMessages)
    );

    if (!showToolCalls) {
      filteredMessages = filteredMessages
        .map((msg) => {
          if (typeof msg.content !== 'string') return msg;

          const lines = msg.content.split('\n');
          const filtered = lines.filter((line) => !line.trim().startsWith('[Tool:'));

          let cleaned = filtered.join('\n');

          while (cleaned.includes('---\n---')) {
            cleaned = cleaned.replace(/---\n---/g, '---');
          }

          cleaned = cleaned
            .split('\n---\n')
            .filter((part) => part.trim().length > 0)
            .join('\n---\n')
            .replace(/^\n*---\n*/g, '')
            .replace(/\n*---\n*$/g, '')
            .trim();

          return { ...msg, content: cleaned };
        })
        .filter((msg) => {
          if (typeof msg.content === 'string') {
            return msg.content.trim().length > 0;
          }
          return true;
        });
    }

    const searchMatches: number[] = [];
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredMessages.forEach((msg, idx) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        if (content.toLowerCase().includes(searchLower)) {
          searchMatches.push(idx);
        }
      });
    }

    content = (
      <>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              {currentSession?.searchMatchCount !== undefined && currentSession.searchMatchCount > 0 && (
                <span className="text-primary">
                  <IconWithBadge
                    icon={Search}
                    count={currentSession.searchMatchCount}
                    label={`${currentSession.searchMatchCount} matches`}
                  />
                </span>
              )}
              {currentSession?.imageCount !== undefined && currentSession.imageCount > 0 && (
                <IconWithBadge
                  icon={Image}
                  count={currentSession.imageCount}
                  label={`${currentSession.imageCount} images`}
                />
              )}
              {currentSession?.customCommandCount !== undefined && currentSession.customCommandCount > 0 && (
                <IconWithBadge
                  icon={Terminal}
                  count={currentSession.customCommandCount}
                  label={`${currentSession.customCommandCount} custom commands`}
                />
              )}
              {currentSession?.filesOrFoldersCount !== undefined && currentSession.filesOrFoldersCount > 0 && (
                <IconWithBadge
                  icon={FileText}
                  count={currentSession.filesOrFoldersCount}
                  label={`${currentSession.filesOrFoldersCount} files/folders`}
                />
              )}
            </div>
          </div>
          <FilterButtons />
        </div>
        {searchQuery && searchMatches.length > 0 && (
          <SearchNavigation
            searchTerm={searchQuery}
            currentIndex={searchMatchIndex}
            totalMatches={searchMatches.length}
            onNext={() => {
              const nextIndex = Math.min(searchMatchIndex + 1, searchMatches.length - 1);
              setSearchMatchIndex(nextIndex);
              const messageElement = document.querySelector(
                `[data-message-index="${searchMatches[nextIndex]}"]`
              ) as HTMLElement;
              messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onPrevious={() => {
              const prevIndex = Math.max(searchMatchIndex - 1, 0);
              setSearchMatchIndex(prevIndex);
              const messageElement = document.querySelector(
                `[data-message-index="${searchMatches[prevIndex]}"]`
              ) as HTMLElement;
              messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onClose={() => updateSearch({ search: undefined })}
          />
        )}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
          {filteredMessages.map((message, msgIdx) => (
            <div key={`${message.type}-${msgIdx}`} data-message-index={msgIdx}>
              <SessionMessage
                message={message}
                imageOffset={0}
                onImageClick={(index) => {
                  setImageModalIndex(index);
                  updateSearch({ imageIndex: index });
                }}
                onPathClick={handlePathClick}
                searchTerm={searchQuery}
                isSearchMatch={searchMatches.includes(msgIdx)}
              />
            </div>
          ))}
        </div>

        {imageModalIndex !== null && (
          <ImageModal
            images={sessionData.images}
            currentIndex={imageModalIndex}
            onClose={() => {
              setImageModalIndex(null);
              updateSearch({});
            }}
            onNext={() => {
              const currentIdx = sessionData.images.findIndex((img) => img.index === imageModalIndex);
              const nextIndex = sessionData.images[(currentIdx + 1) % sessionData.images.length].index;
              setImageModalIndex(nextIndex);
              updateSearch({ imageIndex: nextIndex });
            }}
            onPrev={() => {
              const currentIdx = sessionData.images.findIndex((img) => img.index === imageModalIndex);
              const prevIndex =
                sessionData.images[(currentIdx - 1 + sessionData.images.length) % sessionData.images.length].index;
              setImageModalIndex(prevIndex);
              updateSearch({ imageIndex: prevIndex });
            }}
          />
        )}

        {fileModalPath && (
          <FileModal
            projectId={selectedProject}
            sessionId={sessionId}
            filePath={fileModalPath}
            onClose={() => {
              setFileModalPath(null);
              updateSearch({ folderPath: folderModalPath || undefined });
            }}
          />
        )}

        {folderModalPath && (
          <FolderModal
            projectId={selectedProject}
            sessionId={sessionId}
            folderPath={folderModalPath}
            onClose={() => {
              setFolderModalPath(null);
              updateSearch({});
            }}
            onFileClick={(path) => {
              setFileModalPath(path);
              updateSearch({ filePath: path, folderPath: folderModalPath });
            }}
            onFolderClick={(path) => {
              setFolderModalPath(path);
              updateSearch({ folderPath: path });
            }}
          />
        )}
      </>
    );
  }

  return <Layout sidebar={sidebar}>{content}</Layout>;
}
