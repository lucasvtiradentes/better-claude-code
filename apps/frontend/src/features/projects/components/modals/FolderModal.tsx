import { FolderEntry } from '@better-claude-code/shared';
import { useCallback, useEffect, useState } from 'react';
import { useGetApiSessionsProjectNameSessionIdFolder } from '@/api';

type FolderModalProps = {
  projectId: string;
  sessionId: string;
  folderPath: string;
  onClose: () => void;
  onFileClick: (filePath: string) => void;
};

export const FolderModal = ({ projectId, sessionId, folderPath, onClose, onFileClick }: FolderModalProps) => {
  const [pathHistory, setPathHistory] = useState<string[]>([folderPath]);

  const currentPath = pathHistory[pathHistory.length - 1];

  const {
    data,
    isLoading: loading,
    error
  } = useGetApiSessionsProjectNameSessionIdFolder(
    projectId,
    sessionId,
    { path: currentPath },
    { query: { enabled: !!(projectId && sessionId && currentPath) } }
  );

  const entries = data?.entries ?? [];

  const handleBack = useCallback(() => {
    if (pathHistory.length > 1) {
      setPathHistory(pathHistory.slice(0, -1));
    }
  }, [pathHistory]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pathHistory.length > 1) {
          handleBack();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pathHistory, onClose, handleBack]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEntryClick = (entry: (typeof entries)[number]) => {
    if (entry.type === FolderEntry.FILE) {
      onFileClick(entry.path);
    } else {
      setPathHistory([...pathHistory, entry.path]);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      ts: '📘',
      tsx: '⚛️',
      js: '📜',
      jsx: '⚛️',
      json: '📋',
      py: '🐍',
      rs: '🦀',
      go: '🐹',
      java: '☕',
      md: '📝',
      css: '🎨',
      html: '🌐',
      xml: '📄',
      yaml: '⚙️',
      yml: '⚙️',
      sh: '🔧',
      bash: '🔧',
      dockerfile: '🐳',
      gitignore: '🙈',
      env: '🔐'
    };
    return iconMap[ext || ''] || '📄';
  };

  return (
    <button
      type="button"
      className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4 border-0"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal rounded-lg max-w-4xl w-full h-[600px] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {pathHistory.length > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors"
              >
                ←
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {currentPath.split('/').pop() || currentPath}
              </h2>
              <p className="text-xs text-muted-foreground truncate mt-1">{currentPath}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          )}
          {!error && entries.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full text-muted-foreground">Empty folder</div>
          )}
          {!error && entries.length > 0 && (
            <div className="space-y-1" style={{ opacity: loading ? 0.5 : 1 }}>
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => handleEntryClick(entry)}
                  className="w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 group"
                  disabled={loading}
                >
                  <span className="text-lg">
                    {entry.type === FolderEntry.DIRECTORY ? '📁' : getFileIcon(entry.name)}
                  </span>
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {entry.name}
                  </span>
                  {entry.type === FolderEntry.DIRECTORY && (
                    <span className="ml-auto text-muted-foreground group-hover:text-foreground">→</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
