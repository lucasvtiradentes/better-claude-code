import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type PredefinedFile = {
  path: string;
  label: string;
};

type FileContent = {
  content: string;
  isSymlink: boolean;
  realPath: string;
  extension: string;
};

const fetchFilesList = async (): Promise<{ files: PredefinedFile[] }> => {
  const response = await fetch('/api/files/list');
  if (!response.ok) {
    throw new Error('Failed to fetch files list');
  }
  return response.json();
};

const fetchFileContent = async (filePath: string): Promise<FileContent> => {
  const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to load file');
  }
  return response.json();
};

const saveFileContent = async ({ path, content }: { path: string; content: string }): Promise<void> => {
  const response = await fetch('/api/files', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path, content })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to save file');
  }
};

export const useFilesList = () => {
  return useQuery({
    queryKey: ['files', 'list'],
    queryFn: fetchFilesList
  });
};

export const useFileContent = (filePath: string | null) => {
  return useQuery({
    queryKey: ['files', 'content', filePath],
    queryFn: () => {
      if (!filePath) throw new Error('File path is required');
      return fetchFileContent(filePath);
    },
    enabled: !!filePath
  });
};

export const useSaveFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveFileContent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['files', 'content', variables.path]
      });
    }
  });
};
