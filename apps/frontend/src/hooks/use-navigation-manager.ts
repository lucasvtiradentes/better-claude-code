import { useNavigate } from '@tanstack/react-router';

interface NavigationParams {
  selectedProject?: string;
  sessionId?: string;
  imageIndex?: number;
  folderPath?: string;
  filePath?: string;
  searchQuery?: string;
  search?: string;
}

export function useNavigationManager(currentParams: NavigationParams) {
  const navigate = useNavigate();

  const updateSearch = (updates: Partial<NavigationParams>) => {
    navigate({
      to: '/projects',
      search: {
        project: currentParams.selectedProject,
        sessionId: currentParams.sessionId,
        imageIndex: undefined,
        folderPath: undefined,
        filePath: undefined,
        search: currentParams.searchQuery,
        ...updates
      }
    });
  };

  const handlePathClick = (
    path: string,
    currentFolderModalPath: string | null,
    setFileModalPath: (path: string) => void,
    setFolderModalPath: (path: string) => void
  ) => {
    const hasExtension = /\.[^./\\]+$/.test(path);
    if (hasExtension) {
      setFileModalPath(path);
      updateSearch({ filePath: path, folderPath: currentFolderModalPath || undefined });
    } else {
      setFolderModalPath(path);
      updateSearch({ folderPath: path });
    }
  };

  const navigateToProject = (projectId: string) => {
    navigate({
      to: '/projects',
      search: {
        project: projectId,
        sessionId: undefined,
        imageIndex: undefined,
        folderPath: undefined,
        filePath: undefined,
        search: undefined
      }
    });
  };

  const navigateToSession = (sid: string) => {
    navigate({
      to: '/projects',
      search: {
        project: currentParams.selectedProject,
        sessionId: sid,
        imageIndex: undefined,
        folderPath: undefined,
        filePath: undefined,
        search: currentParams.searchQuery
      }
    });
  };

  const navigateBack = () => {
    navigate({
      to: '/projects',
      search: {
        project: undefined,
        sessionId: undefined,
        imageIndex: undefined,
        folderPath: undefined,
        filePath: undefined,
        search: undefined
      }
    });
  };

  return {
    updateSearch,
    handlePathClick,
    navigateToProject,
    navigateToSession,
    navigateBack
  };
}
