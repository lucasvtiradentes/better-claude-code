import { createFileRoute, redirect } from '@tanstack/react-router';
import { SessionsListPage } from '../../../features/project-sessions/pages/sessions-list.page';

export const Route = createFileRoute('/projects/$projectName/')({
  component: SessionsListComponent,
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
  const navigate = Route.useNavigate();

  return <SessionsListPage projectName={projectName} navigate={navigate} />;
}
