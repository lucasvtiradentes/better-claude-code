import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
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

export const FileModal = ({ projectId, sessionId, filePath, onClose }: FileModalProps) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [highlightLines, setHighlightLines] = useState<number[]>([]);
  const [displayContent, setDisplayContent] = useState<string>('');
  const [firstDisplayLine, setFirstDisplayLine] = useState<number>(1);
  const [showTopRemaining, setShowTopRemaining] = useState(false);
  const [showBottomRemaining, setShowBottomRemaining] = useState(false);
  const [hasTopRemaining, setHasTopRemaining] = useState(false);
  const [hasBottomRemaining, setHasBottomRemaining] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { cleanPath, startLine, endLine } = parseFilePath(filePath);

        const res = await fetch(
          `/api/sessions/${encodeURIComponent(projectId)}/${sessionId}/file?path=${encodeURIComponent(cleanPath)}`
        );
        if (!res.ok) {
          throw new Error('Failed to load file');
        }
        const data = await res.json();
        const fullContent = data.content;
        setContent(fullContent);

        if (startLine) {
          const lines: number[] = [];
          const end = endLine || startLine;
          for (let i = startLine; i <= end; i++) {
            lines.push(i);
          }
          setHighlightLines(lines);

          const allLines = fullContent.split('\n');
          const firstLine = Math.max(1, startLine - CONTEXT_LINES_AROUND_HIGHLIGHT);
          const lastLine = Math.min(allLines.length, end + CONTEXT_LINES_AROUND_HIGHLIGHT);

          setHasTopRemaining(firstLine > 1);
          setHasBottomRemaining(lastLine < allLines.length);

          const startIndex = firstLine - 1;
          const endIndex = lastLine;
          const contentLines = allLines.slice(startIndex, endIndex);

          setDisplayContent(contentLines.join('\n'));
          setFirstDisplayLine(firstLine);
        } else {
          setHighlightLines([]);
          setDisplayContent(fullContent);
          setFirstDisplayLine(1);
          setHasTopRemaining(false);
          setHasBottomRemaining(false);
        }
        setShowTopRemaining(false);
        setShowBottomRemaining(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [projectId, sessionId, filePath]);

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
      setTimeout(() => {
        const firstHighlightedLine = highlightLines[0];
        const lineHeight = 20;
        const scrollPosition = (firstHighlightedLine - 3) * lineHeight;

        if (contentContainerRef.current) {
          contentContainerRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }, 100);
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 border-0"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1e1e1e] rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[#e0e0e0] truncate">{filePath.split('/').pop()}</h2>
            <p className="text-xs text-[#858585] truncate mt-1">{filePath}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              type="button"
              onClick={handleCopy}
              className="text-[#858585] hover:text-[#e0e0e0] px-3 py-1.5 flex items-center gap-2 rounded hover:bg-[#3e3e42] transition-colors text-sm"
              disabled={loading || !!error}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#858585] hover:text-[#e0e0e0] text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-[#3e3e42] transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto" ref={contentContainerRef}>
          {loading && <div className="flex items-center justify-center h-full text-[#858585]">Loading file...</div>}
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          {!loading && !error && (
            <>
              {hasTopRemaining && (
                <div className="sticky top-0 z-10 bg-[#1e1e1e] border-b border-[#3e3e42] px-4 py-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowTopRemaining(!showTopRemaining)}
                    className="text-[#858585] hover:text-[#e0e0e0] text-sm flex items-center gap-2 hover:bg-[#3e3e42] px-3 py-1.5 rounded transition-colors"
                  >
                    {showTopRemaining ? '▼' : '▶'} {showTopRemaining ? 'Hide' : 'Show'} remaining code above
                  </button>
                </div>
              )}
              <SyntaxHighlighter
                language={getLanguageFromPath(filePath.split('#')[0])}
                style={vscDarkPlus}
                showLineNumbers
                startingLineNumber={getStartingLineNumber()}
                wrapLines={highlightLines.length > 0}
                lineNumberStyle={(lineNumber) => {
                  const isHighlighted = highlightLines.includes(lineNumber);
                  return isHighlighted
                    ? {
                        backgroundColor: 'rgba(255, 152, 0, 0.3)',
                        color: '#ff9800',
                        fontWeight: 'bold'
                      }
                    : {};
                }}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: '#1e1e1e',
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
                <div className="sticky bottom-0 z-10 bg-[#1e1e1e] border-t border-[#3e3e42] px-4 py-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowBottomRemaining(!showBottomRemaining)}
                    className="text-[#858585] hover:text-[#e0e0e0] text-sm flex items-center gap-2 hover:bg-[#3e3e42] px-3 py-1.5 rounded transition-colors"
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
