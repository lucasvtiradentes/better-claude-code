import type { Session } from '@bcc/shared';
import { useInfiniteQuery } from '@tanstack/react-query';

type SessionsResponse = {
  items: Session[];
  meta: {
    totalItems: number;
    totalPages: number;
    page: number;
    limit: number;
  };
};

const fetchSessions = async (projectName: string, page: number): Promise<SessionsResponse> => {
  const response = await fetch(`/api/sessions/${encodeURIComponent(projectName)}?page=${page}&limit=20`);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
};

export const useSessions = (projectName: string) => {
  return useInfiniteQuery({
    queryKey: ['sessions', projectName],
    queryFn: ({ pageParam = 1 }) => fetchSessions(projectName, pageParam),
    enabled: !!projectName,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });
};
