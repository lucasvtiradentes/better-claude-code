import type { GetApiProjects200AnyOfTwoGroupsItemItemsItem, GetApiSessionsProjectName200GroupsItem } from '@/api';

interface UseSessionSidebarPropsParams {
  sessions: GetApiSessionsProjectName200GroupsItem[] | undefined;
  isLoadingGrouped: boolean;
  errorGrouped: unknown;
  selectedProjectData: GetApiProjects200AnyOfTwoGroupsItemItemsItem | undefined;
  projectName: string;
  sessionId: string;
  totalSessions: number;
  sessionSearch: string;
  setSessionSearch: (value: string) => void;
  navigateToProject: () => void;
  navigateToSession: (sessionId: string) => void;
  openDeleteModal: (sessionId: string) => void;
  handleLabelToggle: (sessionId: string, labelId: string) => void;
}

export function useSessionSidebarProps({
  sessions,
  isLoadingGrouped,
  errorGrouped,
  selectedProjectData,
  projectName,
  sessionId,
  totalSessions,
  sessionSearch,
  setSessionSearch,
  navigateToProject,
  navigateToSession,
  openDeleteModal,
  handleLabelToggle
}: UseSessionSidebarPropsParams) {
  return {
    sessions,
    isLoading: isLoadingGrouped,
    error: errorGrouped,
    projectName: selectedProjectData?.name || projectName,
    projectPath: selectedProjectData?.path || '',
    selectedSessionId: sessionId,
    totalSessions,
    searchValue: sessionSearch,
    onSearchChange: setSessionSearch,
    onBack: navigateToProject,
    onSelectSession: navigateToSession,
    onDeleteSession: openDeleteModal,
    onLabelToggle: handleLabelToggle,
    projectId: selectedProjectData?.id || projectName,
    isGitRepo: selectedProjectData?.isGitRepo
  };
}
