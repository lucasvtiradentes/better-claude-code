import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useSessionData, groupMessages } from '../hooks/use-session-data';
import { useFilterStore } from '../stores/filter-store';
import { FilterButtons } from '../components/FilterButtons';
import { SessionMessage } from '../components/SessionMessage';
import { ImageModal } from '../components/ImageModal';

export const Route = createFileRoute('/repositories/$repoName/$sessionId')({
  component: SessionViewerComponent
});

function SessionViewerComponent() {
  const navigate = useNavigate();
  const { repoName, sessionId } = Route.useParams();
  const { showUserMessages, showAssistantMessages } = useFilterStore();
  const { data, isLoading, error } = useSessionData(repoName, sessionId);
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);

  const scrollKey = `scroll-${repoName}-${sessionId}`;

  useEffect(() => {
    const savedScroll = localStorage.getItem(scrollKey);
    if (savedScroll) {
      window.scrollTo(0, Number(savedScroll));
    }

    const handleScroll = () => {
      localStorage.setItem(scrollKey, String(window.scrollY));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollKey]);

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate({ to: '/repositories' })}
          className="text-text-accent hover:text-text-accent/80"
        >
          ← Back
        </button>
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-red-500">Failed to load session</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate({ to: '/repositories' })}
          className="text-text-accent hover:text-text-accent/80"
        >
          ← Back
        </button>
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  const grouped = groupMessages(data.messages);
  const filteredGroups = grouped.filter(
    (group) =>
      (group.type === 'user' && showUserMessages) ||
      (group.type === 'assistant' && showAssistantMessages)
  );

  let imageOffset = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/repositories' })}
          className="text-text-accent hover:text-text-accent/80"
        >
          ← Back to repositories
        </button>
        <FilterButtons />
      </div>

      <div className="space-y-4">
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {group.messages.map((message, msgIdx) => {
              const currentOffset = imageOffset;
              const content =
                typeof message.content === 'string'
                  ? message.content
                  : message.content.filter((c) => c.type === 'image').length;
              if (typeof content === 'number') imageOffset += content;

              return (
                <div key={msgIdx}>
                  <SessionMessage
                    message={message}
                    imageOffset={currentOffset}
                    onImageClick={setImageModalIndex}
                  />
                  {msgIdx < group.messages.length - 1 && (
                    <div className="my-2 border-t border-border/50" />
                  )}
                </div>
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
    </div>
  );
}
