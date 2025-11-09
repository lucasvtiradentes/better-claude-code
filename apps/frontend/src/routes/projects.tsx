import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getGetApiProjectsQueryOptions, getGetApiSettingsQueryOptions } from '@/api';
import { queryClient } from '@/lib/tanstack-query';

export const Route = createFileRoute('/projects')({
  component: ProjectsLayout,
  loader: () => {
    queryClient.ensureQueryData(getGetApiProjectsQueryOptions());
    queryClient.ensureQueryData(getGetApiSettingsQueryOptions());
  }
});

function ProjectsLayout() {
  return <Outlet />;
}
