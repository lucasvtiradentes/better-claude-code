import type { Project } from '@bcc/shared';
import { useQuery } from '@tanstack/react-query';

const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    placeholderData: (previousData) => previousData
  });
};
