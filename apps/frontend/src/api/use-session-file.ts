import { useQuery } from '@tanstack/react-query';

type SessionFileResponse = {
  content: string;
};

type FolderEntry = {
  name: string;
  path: string;
  type: 'file' | 'directory';
};

type SessionFolderResponse = {
  entries: FolderEntry[];
};

const fetchSessionFile = async (
  projectId: string,
  sessionId: string,
  filePath: string
): Promise<SessionFileResponse> => {
  const response = await fetch(
    `/api/sessions/${encodeURIComponent(projectId)}/${sessionId}/file?path=${encodeURIComponent(filePath)}`
  );

  if (!response.ok) {
    throw new Error('Failed to load file');
  }

  return response.json();
};

const fetchSessionFolder = async (
  projectId: string,
  sessionId: string,
  folderPath: string
): Promise<SessionFolderResponse> => {
  const response = await fetch(
    `/api/sessions/${encodeURIComponent(projectId)}/${sessionId}/folder?path=${encodeURIComponent(folderPath)}`
  );

  if (!response.ok) {
    throw new Error('Failed to load folder');
  }

  return response.json();
};

export const useSessionFile = (projectId: string, sessionId: string, filePath: string) => {
  return useQuery({
    queryKey: ['sessions', projectId, sessionId, 'file', filePath],
    queryFn: () => fetchSessionFile(projectId, sessionId, filePath),
    enabled: !!projectId && !!sessionId && !!filePath
  });
};

export const useSessionFolder = (projectId: string, sessionId: string, folderPath: string) => {
  return useQuery({
    queryKey: ['sessions', projectId, sessionId, 'folder', folderPath],
    queryFn: () => fetchSessionFolder(projectId, sessionId, folderPath),
    enabled: !!projectId && !!sessionId && !!folderPath,
    placeholderData: (previousData) => previousData
  });
};
