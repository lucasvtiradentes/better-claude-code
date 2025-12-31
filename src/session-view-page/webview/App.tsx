import { SessionContent } from './components/SessionContent';
import { SessionHeader } from './components/SessionHeader';
import { useMessageFilters } from './hooks/useMessageFilters';
import { useSessionData } from './hooks/useSessionData';
import { vscode } from './utils/vscode';

export const App = () => {
  const sessionData = useSessionData();
  const {
    showUserMessages,
    showAssistantMessages,
    showToolCalls,
    setShowUserMessages,
    setShowAssistantMessages,
    setShowToolCalls,
    filesOrFoldersCount,
    groupedMessages,
    isLoading
  } = useMessageFilters(sessionData);

  const handleImageClick = (imageIndex: number) => {
    if (!sessionData?.conversation.images[imageIndex]) return;
    vscode.postMessage({
      type: 'openImage',
      imageData: sessionData.conversation.images[imageIndex].data,
      imageIndex: sessionData.conversation.images[imageIndex].index
    });
  };

  const handleOpenRaw = () => {
    vscode.postMessage({ type: 'openRawSession' });
  };

  const handleDeleteSession = () => {
    vscode.postMessage({ type: 'deleteSession' });
  };

  const handleCompactSession = () => {
    vscode.postMessage({ type: 'compactSession' });
  };

  const handleOpenParsed = () => {
    vscode.postMessage({ type: 'openParsed' });
  };

  const handleOpenSummary = () => {
    vscode.postMessage({ type: 'openSummary' });
  };

  if (!sessionData || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const { session, conversation } = sessionData;

  return (
    <div
      className="dark bg-background text-foreground"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <SessionHeader
        session={session}
        imageCount={conversation.images.length}
        filesOrFoldersCount={filesOrFoldersCount}
        showUserMessages={showUserMessages}
        showAssistantMessages={showAssistantMessages}
        showToolCalls={showToolCalls}
        hasCompacted={session.compacted || false}
        onToggleUser={() => setShowUserMessages(!showUserMessages)}
        onToggleAssistant={() => setShowAssistantMessages(!showAssistantMessages)}
        onToggleToolCalls={() => setShowToolCalls(!showToolCalls)}
        onOpenRaw={handleOpenRaw}
        onDeleteSession={handleDeleteSession}
        onCompactSession={handleCompactSession}
        onOpenParsed={handleOpenParsed}
        onOpenSummary={handleOpenSummary}
      />

      <SessionContent groupedMessages={groupedMessages} images={conversation.images} onImageClick={handleImageClick} />
    </div>
  );
};
