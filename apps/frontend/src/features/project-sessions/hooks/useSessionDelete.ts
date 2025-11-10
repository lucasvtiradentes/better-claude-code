import { useState } from 'react';
import { toast } from 'sonner';
import {
  type GetApiSessionsProjectName200,
  type GetApiSessionsProjectNameGroupBy,
  getGetApiSessionsProjectNameQueryKey,
  useDeleteApiSessionsProjectNameSessionId
} from '@/api';
import { queryClient } from '@/common/lib/tanstack-query';

export function useSessionDelete(
  projectName: string,
  currentSessionId: string,
  sessionGroupBy: GetApiSessionsProjectNameGroupBy,
  sessionSearch: string,
  onSessionDeleted: () => void
) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const { mutate: deleteSessionMutation, isPending: isDeleting } = useDeleteApiSessionsProjectNameSessionId();

  const openDeleteModal = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setTimeout(() => {
      setDeleteModalOpen(true);
    }, 0);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  const confirmDelete = () => {
    if (!sessionToDelete || !projectName) return;

    deleteSessionMutation(
      { projectName, sessionId: sessionToDelete },
      {
        onSuccess: async () => {
          queryClient.setQueryData<GetApiSessionsProjectName200>(
            getGetApiSessionsProjectNameQueryKey(projectName, {
              groupBy: sessionGroupBy,
              search: sessionSearch || undefined
            }),
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                groups: oldData.groups.map((group) => ({
                  ...group,
                  items: group.items.filter((item) => item.id !== sessionToDelete),
                  totalItems: group.items.filter((item) => item.id !== sessionToDelete).length
                })),
                meta: {
                  ...oldData.meta,
                  totalItems: oldData.meta.totalItems - 1
                }
              };
            }
          );

          if (currentSessionId === sessionToDelete) {
            await onSessionDeleted();
          }

          closeDeleteModal();
          toast.success('Session deleted successfully');
        },
        onError: (error) => {
          console.error('Failed to delete session:', error);
          toast.error('Failed to delete session');
        }
      }
    );
  };

  return {
    deleteModalOpen,
    sessionToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete
  };
}
