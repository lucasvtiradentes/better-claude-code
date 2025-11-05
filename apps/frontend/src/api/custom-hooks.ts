import { API_PREFIX } from '@better-claude-code/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { GetApiSessionsProjectName200 } from './_generated/schemas';
import { customInstance } from './custom-instance';

export const useInfinitySessions = (projectName: string, search: string = '', sortBy: string = 'date') => {
  return useInfiniteQuery({
    queryKey: ['sessions', projectName, search, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      return customInstance<GetApiSessionsProjectName200>({
        url: `${API_PREFIX}/sessions/${encodeURIComponent(projectName)}`,
        method: 'GET',
        params: {
          page: pageParam,
          limit: 20,
          search: search || undefined,
          sortBy
        }
      });
    },
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
