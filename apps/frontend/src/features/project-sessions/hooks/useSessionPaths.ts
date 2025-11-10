import { useCallback } from 'react';
import type z from 'zod';
import type { sessionDetailSearchSchema } from '../pages/session-detail.page';

type SessionDetailQueryParams = z.infer<typeof sessionDetailSearchSchema>;

export function useSessionPaths(
  updateSearch: (updates: SessionDetailQueryParams) => void,
  setFileModalPath: (path: string | null) => void,
  setFolderModalPath: (path: string | null) => void
) {
  const handlePathClick = useCallback(
    (path: string, currentFolderPath: string | null) => {
      const isDirectory = !path.includes('.');
      if (isDirectory) {
        setFolderModalPath(path);
        updateSearch({ folderPath: path, filePath: undefined });
      } else {
        setFileModalPath(path);
        updateSearch({ filePath: path, folderPath: currentFolderPath || undefined });
      }
    },
    [updateSearch, setFileModalPath, setFolderModalPath]
  );

  return { handlePathClick };
}
