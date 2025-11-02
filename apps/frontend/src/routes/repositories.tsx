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
import { useSessionData } from '../hooks/use-session-data';
import { useSessions } from '../hooks/use-sessions';
import { useFilterStore } from '../stores/filter-store';

export const Route = createFileRoute('/repositories')({
  component: RepositoriesComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    repo: (search.repo as string) || undefined,
    sessionId: (search.sessionId as string) || undefined,
    imageIndex: (search.imageIndex as number) || undefined
  })
});

function RepositoriesComponent() {
  const navigate = useNavigate();
  const { repo: selectedRepo, sessionId, imageIndex } = Route.useSearch();
  const { showUserMessages, showAssistantMessages, showToolCalls } = useFilterStore();
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

  useEffect(() => {
    if (imageIndex && sessionData?.images) {
      const imageExists = sessionData.images.some((img) => img.index === imageIndex);
      if (imageExists) {
        setImageModalIndex(imageIndex);
      }
    }
  }, [imageIndex, sessionData]);

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
          search: { repo: repoId, sessionId: undefined, imageIndex: undefined }
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
          search: { repo: undefined, sessionId: undefined, imageIndex: undefined }
        })
      }
      onSelectSession={(sid) =>
        navigate({
          to: '/repositories',
          search: { repo: selectedRepo, sessionId: sid, imageIndex: undefined }
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

    content = (
      <>
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <span className="font-semibold text-sm">{currentSession?.title || 'Session'}</span>
          <FilterButtons />
        </div>
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
          {filteredMessages.map((message, msgIdx) => (
            <SessionMessage
              key={`${message.type}-${msgIdx}`}
              message={message}
              imageOffset={0}
              onImageClick={(index) => {
                setImageModalIndex(index);
                navigate({
                  to: '/repositories',
                  search: { repo: selectedRepo, sessionId, imageIndex: index }
                });
              }}
            />
          ))}
        </div>

        {imageModalIndex !== null && (
          <ImageModal
            images={sessionData.images}
            currentIndex={imageModalIndex}
            onClose={() => {
              setImageModalIndex(null);
              navigate({
                to: '/repositories',
                search: { repo: selectedRepo, sessionId, imageIndex: undefined }
              });
            }}
            onNext={() => {
              const currentIdx = sessionData.images.findIndex((img) => img.index === imageModalIndex);
              const nextIndex = sessionData.images[(currentIdx + 1) % sessionData.images.length].index;
              setImageModalIndex(nextIndex);
              navigate({
                to: '/repositories',
                search: { repo: selectedRepo, sessionId, imageIndex: nextIndex }
              });
            }}
            onPrev={() => {
              const currentIdx = sessionData.images.findIndex((img) => img.index === imageModalIndex);
              const prevIndex =
                sessionData.images[(currentIdx - 1 + sessionData.images.length) % sessionData.images.length].index;
              setImageModalIndex(prevIndex);
              navigate({
                to: '/repositories',
                search: { repo: selectedRepo, sessionId, imageIndex: prevIndex }
              });
            }}
          />
        )}
      </>
    );
  }

  return <Layout sidebar={sidebar}>{content}</Layout>;
}
