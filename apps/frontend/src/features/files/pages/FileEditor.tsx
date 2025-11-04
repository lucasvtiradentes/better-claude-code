import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFileContent, useFilesList, useSaveFile } from '../../../api/use-files';
import { useTheme } from '../../../hooks/use-theme';

export const FileEditor = () => {
  const { theme } = useTheme();
  const { data: filesList } = useFilesList();

  const firstFile = filesList?.files[0]?.path ?? '';
  const [selectedFile, setSelectedFile] = useState<string>(firstFile);

  const actualSelectedFile = selectedFile || firstFile;

  const { data: fileData, isLoading: loading } = useFileContent(actualSelectedFile);
  const { mutate: saveFile, isPending: saving } = useSaveFile();

  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    if (fileData?.content !== undefined) {
      setEditedContent(fileData.content);
    }
  }, [fileData?.content]);

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

  const extensions = useMemo(
    () => (fileData ? getLanguageExtension(fileData.extension) : []),
    [fileData, getLanguageExtension]
  );

  const handleSave = useCallback(() => {
    if (actualSelectedFile) {
      saveFile({ path: actualSelectedFile, content: editedContent });
    }
  }, [actualSelectedFile, editedContent, saveFile]);

  return (
    <div className="flex h-full">
      <div className="w-[300px] border-r border-border bg-card flex flex-col">
        <div className="flex-1 overflow-auto">
          {filesList?.files.map((file) => (
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
            onClick={handleSave}
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
            value={editedContent}
            onChange={setEditedContent}
            theme={theme === 'dark' ? 'dark' : 'light'}
            extensions={extensions}
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
