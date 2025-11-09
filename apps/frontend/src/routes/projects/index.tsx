import { createFileRoute } from '@tanstack/react-router';
import { ProjectsListPage } from '../../features/projects/pages/projects-list.page';

export const Route = createFileRoute('/projects/')({
  component: ProjectsListPage
});
