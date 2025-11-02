import { getTimeGroup } from '@bcc/shared';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { FilterButtons } from '../components/FilterButtons';
import { ImageModal } from '../components/ImageModal';
import { Layout } from '../components/layout/Layout';
import { RepositoriesSidebar } from '../components/repositories/RepositoriesSidebar';
import { SessionMessage } from '../components/sessions/SessionMessage';
import { SessionsSidebar } from '../components/sessions/SessionsSidebar';
import { useRepositories } from '../hooks/use-repositories';
import { groupMessages, useSessionData } from '../hooks/use-session-data';
import { useSessions } from '../hooks/use-sessions';
import { useFilterStore } from '../stores/filter-store';

export const Route = createFileRoute('/repositories')({
  component: RepositoriesComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    repo: (search.repo as string) || undefined,
    sessionId: (search.sessionId as string) || undefined
  })
});

function RepositoriesComponent() {
  const navigate = useNavigate();
  const { repo: selectedRepo, sessionId } = Route.useSearch();
  const { showUserMessages, showAssistantMessages } = useFilterStore();
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: repos, isLoading: reposLoading, error: reposError } = useRepositories();
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useSessions(selectedRepo || '');
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError
  } = useSessionData(selectedRepo || '', sessionId || '');

  const selectedRepoData = repos?.find((r) => r.id === selectedRepo);

  const scrollKey = selectedRepo && sessionId ? `scroll-${selectedRepo}-${sessionId}` : '';

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

  const groupedRepos = repos?.reduce(
    (acc, repo) => {
      const group = getTimeGroup(repo.lastModified);
      if (!acc[group]) acc[group] = [];
      acc[group].push(repo);
      return acc;
    },
    {} as Record<string, typeof repos>
  );

  const groupedSessions = sessions?.reduce(
    (acc, session) => {
      const group = getTimeGroup(session.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(session);
      return acc;
    },
    {} as Record<string, typeof sessions>
  );

  const sidebar = !selectedRepo ? (
    <RepositoriesSidebar
      repos={repos}
      groupedRepos={groupedRepos}
      isLoading={reposLoading}
      error={reposError}
      onSelectRepo={(repoId) =>
        navigate({
          to: '/repositories',
          search: { repo: repoId, sessionId: undefined }
        })
      }
    />
  ) : (
    <SessionsSidebar
      sessions={sessions}
      groupedSessions={groupedSessions}
      isLoading={sessionsLoading}
      error={sessionsError}
      repoName={selectedRepoData?.name || selectedRepo}
      selectedSessionId={sessionId}
      onBack={() =>
        navigate({
          to: '/repositories',
          search: { repo: undefined, sessionId: undefined }
        })
      }
      onSelectSession={(sid) =>
        navigate({
          to: '/repositories',
          search: { repo: selectedRepo, sessionId: sid }
        })
      }
    />
  );

  const currentSession = sessions?.find((s) => s.id === sessionId);

  let content: ReactNode;
  if (!selectedRepo) {
    content = (
      <div className="flex items-center justify-center h-full text-[#858585] text-sm">
        Select a repository to view sessions
      </div>
    );
  } else if (!sessionId) {
    content = (
      <div className="flex items-center justify-center h-full text-[#858585] text-sm">
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
    content = <div className="flex items-center justify-center h-full text-[#858585]">Loading session...</div>;
  } else {
    const grouped = groupMessages(sessionData.messages);
    const filteredGroups = grouped.filter(
      (group) => (group.type === 'user' && showUserMessages) || (group.type === 'assistant' && showAssistantMessages)
    );

    let imageOffset = 0;

    content = (
      <>
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="font-semibold text-sm">{currentSession?.title || 'Session'}</span>
          <FilterButtons />
        </div>
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={`${group.type}-${groupIdx}`}>
              {group.messages.map((message, msgIdx) => {
                const currentOffset = imageOffset;
                const content =
                  typeof message.content === 'string'
                    ? message.content
                    : message.content.filter((c) => c.type === 'image').length;
                if (typeof content === 'number') imageOffset += content;

                return (
                  <SessionMessage
                    key={`${group.type}-${groupIdx}-${msgIdx}`}
                    message={message}
                    imageOffset={currentOffset}
                    onImageClick={setImageModalIndex}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {imageModalIndex !== null && (
          <ImageModal
            images={sessionData.images}
            currentIndex={imageModalIndex}
            onClose={() => setImageModalIndex(null)}
            onNext={() =>
              setImageModalIndex((prev) => {
                const currentIdx = sessionData.images.findIndex((img) => img.index === prev);
                return sessionData.images[(currentIdx + 1) % sessionData.images.length].index;
              })
            }
            onPrev={() =>
              setImageModalIndex((prev) => {
                const currentIdx = sessionData.images.findIndex((img) => img.index === prev);
                return sessionData.images[(currentIdx - 1 + sessionData.images.length) % sessionData.images.length]
                  .index;
              })
            }
          />
        )}
      </>
    );
  }

  return <Layout sidebar={sidebar}>{content}</Layout>;
}
