import { getTimeGroup, TIME_GROUP_LABELS, TIME_GROUP_ORDER } from '@bcc/shared';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { FilterButtons } from '../components/FilterButtons';
import { ImageModal } from '../components/ImageModal';
import { Layout } from '../components/Layout';
import { MiddleSidebar } from '../components/MiddleSidebar';
import { SessionCard } from '../components/SessionCard';
import { SessionMessage } from '../components/SessionMessage';
import { TimeGroup } from '../components/TimeGroup';
import { groupMessages, useSessionData } from '../hooks/use-session-data';
import { useSessions } from '../hooks/use-sessions';
import { useFilterStore } from '../stores/filter-store';

export const Route = createFileRoute('/repositories/$repoName/$sessionId')({
  component: SessionViewerComponent
});

function SessionViewerComponent() {
  const navigate = useNavigate();
  const { repoName, sessionId } = Route.useParams();
  const { showUserMessages, showAssistantMessages } = useFilterStore();
  const { data, isLoading, error } = useSessionData(repoName, sessionId);
  const { data: sessions } = useSessions(repoName);
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollKey = `scroll-${repoName}-${sessionId}`;

  useEffect(() => {
    const savedScroll = localStorage.getItem(scrollKey);
    if (savedScroll && contentRef.current) {
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

  const groupedSessions = sessions?.reduce(
    (acc, session) => {
      const group = getTimeGroup(session.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(session);
      return acc;
    },
    {} as Record<string, typeof sessions>
  );

  const sidebar = (
    <MiddleSidebar
      title={`${sessions?.length || 0} sessions`}
      backButton={{
        label: '← Back',
        onClick: () => navigate({ to: '/repositories' })
      }}
    >
      {TIME_GROUP_ORDER.map((timeGroup) => {
        const groupSessions = groupedSessions?.[timeGroup];
        if (!groupSessions?.length) return null;

        return (
          <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]} groupKey={timeGroup}>
            {groupSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                repoName={repoName}
                isActive={session.id === sessionId}
                onClick={() =>
                  navigate({
                    to: '/repositories/$repoName/$sessionId',
                    params: { repoName, sessionId: session.id }
                  })
                }
              />
            ))}
          </TimeGroup>
        );
      })}
    </MiddleSidebar>
  );

  if (error) {
    return (
      <Layout sidebar={sidebar}>
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">Failed to load session</p>
        </div>
      </Layout>
    );
  }

  if (isLoading || !data) {
    return (
      <Layout sidebar={sidebar}>
        <div className="flex items-center justify-center h-full text-[#858585]">Loading session...</div>
      </Layout>
    );
  }

  const grouped = groupMessages(data.messages);
  const filteredGroups = grouped.filter(
    (group) => (group.type === 'user' && showUserMessages) || (group.type === 'assistant' && showAssistantMessages)
  );

  const currentSession = sessions?.find((s) => s.id === sessionId);
  let imageOffset = 0;

  return (
    <Layout sidebar={sidebar}>
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
          images={data.images}
          currentIndex={imageModalIndex}
          onClose={() => setImageModalIndex(null)}
          onNext={() =>
            setImageModalIndex((prev) => {
              const currentIdx = data.images.findIndex((img) => img.index === prev);
              return data.images[(currentIdx + 1) % data.images.length].index;
            })
          }
          onPrev={() =>
            setImageModalIndex((prev) => {
              const currentIdx = data.images.findIndex((img) => img.index === prev);
              return data.images[(currentIdx - 1 + data.images.length) % data.images.length].index;
            })
          }
        />
      )}
    </Layout>
  );
}
