import { useEffect, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useGetApiSessionsProjectNameSessionIdFile } from '@/api';
import { useTheme } from '@/hooks/use-theme';

type FileModalProps = {
  projectId: string;
  sessionId: string;
  filePath: string;
  onClose: () => void;
};

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <title>Copy</title>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <title>Copied</title>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CONTEXT_LINES_AROUND_HIGHLIGHT = 5;

const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
    rb: 'ruby',
    php: 'php',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    r: 'r',
    lua: 'lua',
    vim: 'vim',
    dockerfile: 'dockerfile',
    gitignore: 'bash',
    env: 'bash'
  };
  return langMap[ext || ''] || 'text';
};

const parseFilePath = (path: string) => {
  const match = path.match(/^(.+?)(?:#L(\d+)(?:-(\d+))?)?$/);
  if (!match) return { cleanPath: path, startLine: null, endLine: null };

  const [, cleanPath, startLine, endLine] = match;
  return {
    cleanPath,
    startLine: startLine ? Number.parseInt(startLine, 10) : null,
    endLine: endLine ? Number.parseInt(endLine, 10) : null
  };
};

export const FileModal = ({ projectId, sessionId, filePath, onClose }: FileModalProps) => {
  const { isDarkMode } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showTopRemaining, setShowTopRemaining] = useState(false);
  const [showBottomRemaining, setShowBottomRemaining] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const { cleanPath, startLine, endLine } = useMemo(() => parseFilePath(filePath), [filePath]);

  const {
    data,
    isLoading: loading,
    error
  } = useGetApiSessionsProjectNameSessionIdFile(
    projectId,
    sessionId,
    { path: cleanPath },
    { query: { enabled: !!(projectId && sessionId && cleanPath) } }
  );

  const content = data?.content ?? '';

  const highlightLines = useMemo(() => {
    if (!startLine) return [];
    const lines: number[] = [];
    const end = endLine || startLine;
    for (let i = startLine; i <= end; i++) {
      lines.push(i);
    }
    return lines;
  }, [startLine, endLine]);

  const displayInfo = useMemo(() => {
    if (!content) {
      return {
        displayContent: '',
        firstDisplayLine: 1,
        hasTopRemaining: false,
        hasBottomRemaining: false
      };
    }

    if (!startLine) {
      return {
        displayContent: content,
        firstDisplayLine: 1,
        hasTopRemaining: false,
        hasBottomRemaining: false
      };
    }

    const allLines = content.split('\n');
    const end = endLine || startLine;
    const firstLine = Math.max(1, startLine - CONTEXT_LINES_AROUND_HIGHLIGHT);
    const lastLine = Math.min(allLines.length, end + CONTEXT_LINES_AROUND_HIGHLIGHT);

    const startIndex = firstLine - 1;
    const endIndex = lastLine;
    const contentLines = allLines.slice(startIndex, endIndex);

    return {
      displayContent: contentLines.join('\n'),
      firstDisplayLine: firstLine,
      hasTopRemaining: firstLine > 1,
      hasBottomRemaining: lastLine < allLines.length
    };
  }, [content, startLine, endLine]);

  const { displayContent, firstDisplayLine, hasTopRemaining, hasBottomRemaining } = displayInfo;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!loading && !error && highlightLines.length > 0 && contentContainerRef.current) {
      const timer = setTimeout(() => {
        const firstHighlightedLine = highlightLines[0];
        const lineHeight = 20;
        const scrollPosition = (firstHighlightedLine - 3) * lineHeight;

        if (contentContainerRef.current) {
          contentContainerRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error, highlightLines]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFullDisplayContent = () => {
    if (highlightLines.length === 0) {
      return displayContent;
    }

    const allLines = content.split('\n');
    const contextLines = displayContent.split('\n');
    const result: string[] = [];

    if (hasTopRemaining) {
      if (showTopRemaining) {
        result.push(...allLines.slice(0, firstDisplayLine - 1));
      }
    }

    result.push(...contextLines);

    if (hasBottomRemaining) {
      if (showBottomRemaining) {
        const lastDisplayLine = firstDisplayLine + contextLines.length - 1;
        result.push(...allLines.slice(lastDisplayLine));
      }
    }

    return result.join('\n');
  };

  const getStartingLineNumber = () => {
    if (highlightLines.length === 0 || !hasTopRemaining || !showTopRemaining) {
      return firstDisplayLine;
    }
    return 1;
  };

  return (
    <button
      type="button"
      className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-[60] p-4 border-0"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{filePath.split('/').pop()}</h2>
            <p className="text-xs text-muted-foreground truncate mt-1">{filePath}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              type="button"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground px-3 py-1.5 flex items-center gap-2 rounded hover:bg-accent transition-colors text-sm"
              disabled={loading || !!error}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto" ref={contentContainerRef}>
          {loading && (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading file...</div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          )}
          {!loading && !error && content && (
            <>
              {hasTopRemaining && (
                <div className="sticky top-0 z-10 bg-modal border-b border-border px-4 py-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowTopRemaining(!showTopRemaining)}
                    className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 hover:bg-accent px-3 py-1.5 rounded transition-colors"
                  >
                    {showTopRemaining ? '▼' : '▶'} {showTopRemaining ? 'Hide' : 'Show'} remaining code above
                  </button>
                </div>
              )}
              <SyntaxHighlighter
                language={getLanguageFromPath(filePath.split('#')[0])}
                style={isDarkMode ? vscDarkPlus : prism}
                showLineNumbers
                startingLineNumber={getStartingLineNumber()}
                wrapLines={highlightLines.length > 0}
                lineNumberStyle={(lineNumber) => {
                  const isHighlighted = highlightLines.includes(lineNumber);
                  return isHighlighted
                    ? {
                        backgroundColor: 'hsl(var(--primary) / 0.3)',
                        color: 'hsl(var(--primary))',
                        fontWeight: 'bold'
                      }
                    : {};
                }}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: 'hsl(var(--modal))',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  userSelect: 'text'
                }}
                codeTagProps={{
                  style: {
                    userSelect: 'text'
                  }
                }}
              >
                {getFullDisplayContent()}
              </SyntaxHighlighter>
              {hasBottomRemaining && (
                <div className="sticky bottom-0 z-10 bg-modal border-t border-border px-4 py-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowBottomRemaining(!showBottomRemaining)}
                    className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 hover:bg-accent px-3 py-1.5 rounded transition-colors"
                  >
                    {showBottomRemaining ? '▼' : '▶'} {showBottomRemaining ? 'Hide' : 'Show'} remaining code below
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  );
};
