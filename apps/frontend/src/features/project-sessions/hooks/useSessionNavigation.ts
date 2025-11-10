import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import type z from 'zod';
import { sessionDetailSearchSchema } from '../pages/session-detail.page';

type SessionDetailQueryParams = z.infer<typeof sessionDetailSearchSchema>;

export function useSessionNavigation(projectName: string, skipCache?: boolean) {
  const navigate = useNavigate({ from: '/projects/$projectName/sessions/$sessionId' });

  const updateSearch = useCallback(
    (updates: SessionDetailQueryParams) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...updates
        })
      });
    },
    [navigate]
  );

  const navigateToProject = useCallback(() => {
    navigate({
      to: '/projects/$projectName',
      params: { projectName },
      search: skipCache ? { skipCache: true } : undefined
    });
  }, [navigate, projectName, skipCache]);

  const navigateToSession = useCallback(
    (newSessionId: string) => {
      navigate({
        to: '/projects/$projectName/sessions/$sessionId',
        params: { projectName, sessionId: newSessionId },
        search: skipCache ? { skipCache: true } : undefined
      });
    },
    [navigate, projectName, skipCache]
  );

  return {
    updateSearch,
    navigateToProject,
    navigateToSession
  };
}
