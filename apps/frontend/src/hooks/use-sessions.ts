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

const fetchSessions = async (
  projectName: string,
  page: number,
  search: string,
  sortBy: string
): Promise<SessionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    sortBy
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`/api/sessions/${encodeURIComponent(projectName)}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
};

export const useSessions = (projectName: string, search: string = '', sortBy: string = 'date') => {
  return useInfiniteQuery({
    queryKey: ['sessions', projectName, search, sortBy],
    queryFn: ({ pageParam = 1 }) => fetchSessions(projectName, pageParam, search, sortBy),
    enabled: !!projectName,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });
};
