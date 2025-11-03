import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../../hooks/use-theme';

type PredefinedFile = {
  path: string;
  label: string;
};

export const FileEditor = () => {
  const { theme } = useTheme();
  const [files, setFiles] = useState<PredefinedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [fileInfo, setFileInfo] = useState<{
    isSymlink: boolean;
    realPath: string;
    extension: string;
  } | null>(null);

  const getLanguageExtension = useCallback((extension: string) => {
    switch (extension) {
      case '.md':
        return [markdown()];
      case '.json':
        return [json()];
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx':
        return [javascript({ typescript: extension.includes('ts') })];
      default:
        return [];
    }
  }, []);

  const loadFile = useCallback(async (filePath: string) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load file');
      }

      const data = await response.json();
      setContent(data.content);
      setFileInfo({
        isSymlink: data.isSymlink,
        realPath: data.realPath,
        extension: data.extension
      });
    } catch (err) {
      console.error('Failed to load file:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveFile = useCallback(async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: selectedFile,
          content
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save file');
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setSaving(false);
    }
  }, [selectedFile, content]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/files/list');
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files);
          if (data.files.length > 0) {
            setSelectedFile(data.files[0].path);
          }
        }
      } catch (err) {
        console.error('Failed to fetch files:', err);
      }
    };

    fetchFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadFile(selectedFile);
    }
  }, [selectedFile, loadFile]);

  return (
    <div className="flex h-full">
      <div className="w-[300px] border-r border-border bg-card flex flex-col">
        <div className="flex-1 overflow-auto">
          {files.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setSelectedFile(file.path)}
              className={`
                w-full px-4 py-3 text-left border-b border-border
                transition-colors duration-100
                ${selectedFile === file.path ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
              `}
            >
              <div className="text-sm font-medium">{file.label}</div>
              <div className="text-xs text-muted-foreground truncate mt-1">{file.path}</div>
            </button>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={saveFile}
            disabled={loading || saving}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>
        ) : (
          <CodeMirror
            value={content}
            onChange={(value) => setContent(value)}
            theme={theme === 'dark' ? 'dark' : 'light'}
            extensions={fileInfo ? getLanguageExtension(fileInfo.extension) : []}
            className="h-full"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true
            }}
          />
        )}
      </div>
    </div>
  );
};
