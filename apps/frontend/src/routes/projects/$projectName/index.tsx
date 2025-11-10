import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';
import { SessionsListPage } from '../../../features/project-sessions/pages/sessions-list.page';

const sessionsListSearchSchema = z.object({
  skipCache: z.boolean().optional()
});

export const Route = createFileRoute('/projects/$projectName/')({
  component: SessionsListComponent,
  validateSearch: (search) => sessionsListSearchSchema.parse(search),
  beforeLoad: ({ params }) => {
    if (params.projectName.includes('/sessions/')) {
      throw redirect({
        to: '/projects/$projectName',
        params: { projectName: params.projectName.split('/sessions/')[0] }
      });
    }
  }
});

function SessionsListComponent() {
  const { projectName } = Route.useParams();
  const { skipCache } = Route.useSearch();

  return <SessionsListPage projectName={projectName} skipCache={skipCache} />;
}
