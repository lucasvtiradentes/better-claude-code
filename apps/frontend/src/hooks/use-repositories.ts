import type { Repository } from '@bcc/shared';
import { useQuery } from '@tanstack/react-query';

const fetchRepositories = async (): Promise<Repository[]> => {
  const response = await fetch('/api/repos');
  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }
  return response.json();
};

export const useRepositories = () => {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: fetchRepositories
  });
};
