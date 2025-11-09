import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getGetApiSettingsQueryOptions } from '@/api';
import { queryClient } from '@/common/lib/tanstack-query';

export const Route = createFileRoute('/projects')({
  component: ProjectsLayout,
  loader: () => {
    queryClient.ensureQueryData(getGetApiSettingsQueryOptions());
  }
});

function ProjectsLayout() {
  return <Outlet />;
}
