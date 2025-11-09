import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ProjectsListPage } from '../../features/projects/pages/projects-list.page';

const projectsSearchSchema = z.object({
  projectSearch: z.string().optional()
});

export const Route = createFileRoute('/projects/')({
  component: ProjectsListPage,
  validateSearch: projectsSearchSchema
});
