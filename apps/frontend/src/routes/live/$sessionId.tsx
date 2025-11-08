import { createFileRoute } from '@tanstack/react-router';
import { LiveSessionView } from '@/features/live-sessions/LiveSessionView';

export const Route = createFileRoute('/live/$sessionId')({
  component: LiveSession,
  validateSearch: (search: Record<string, unknown>) => ({
    projectPath: (search.projectPath as string) || '',
    projectName: (search.projectName as string) || ''
  })
});

function LiveSession() {
  const { sessionId } = Route.useParams();
  const { projectPath, projectName } = Route.useSearch();

  return <LiveSessionView sessionId={sessionId} projectPath={projectPath} projectName={projectName} />;
}
