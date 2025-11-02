import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type FileModalProps = {
  repoId: string;
  sessionId: string;
  filePath: string;
  onClose: () => void;
};

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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

export const FileModal = ({ repoId, sessionId, filePath, onClose }: FileModalProps) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/sessions/${encodeURIComponent(repoId)}/${sessionId}/file?path=${encodeURIComponent(filePath)}`
        );
        if (!res.ok) {
          throw new Error('Failed to load file');
        }
        const data = await res.json();
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [repoId, sessionId, filePath]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

        <div className="flex-1 overflow-auto">
          {loading && <div className="flex items-center justify-center h-full text-[#858585]">Loading file...</div>}
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          {!loading && !error && (
            <SyntaxHighlighter
              language={getLanguageFromPath(filePath)}
              style={vscDarkPlus}
              showLineNumbers
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
              {content}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </button>
  );
};
