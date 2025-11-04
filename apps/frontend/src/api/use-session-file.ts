import { useQuery } from '@tanstack/react-query';

type SessionFileResponse = {
  content: string;
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

export const useSessionFile = (projectId: string, sessionId: string, filePath: string) => {
  return useQuery({
    queryKey: ['sessions', projectId, sessionId, 'file', filePath],
    queryFn: () => fetchSessionFile(projectId, sessionId, filePath),
    enabled: !!projectId && !!sessionId && !!filePath
  });
};
