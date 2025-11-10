import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';
import { ProjectsListPage } from '../../features/projects/pages/projects-list.page';

const projectsListSearchSchema = z.object({
  skipCache: z.boolean().optional()
});

export const Route = createFileRoute('/projects/')({
  component: ProjectsListComponent,
  validateSearch: (search) => projectsListSearchSchema.parse(search)
});

function ProjectsListComponent() {
  const { skipCache } = Route.useSearch();
  return <ProjectsListPage skipCache={skipCache} />;
}
