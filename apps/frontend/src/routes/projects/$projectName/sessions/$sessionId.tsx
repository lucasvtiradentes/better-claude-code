import { createFileRoute } from '@tanstack/react-router';
import { getGetApiSessionsProjectNameSessionIdQueryOptions } from '@/api';
import { queryClient } from '@/common/lib/tanstack-query';
import {
  SessionDetailPage,
  sessionDetailSearchSchema
} from '../../../../features/project-sessions/pages/session-detail.page';

export const Route = createFileRoute('/projects/$projectName/sessions/$sessionId')({
  component: SessionDetailComponent,
  validateSearch: (search) => sessionDetailSearchSchema.parse(search),
  loader: ({ params }) => {
    queryClient.ensureQueryData(
      getGetApiSessionsProjectNameSessionIdQueryOptions(params.projectName, params.sessionId)
    );
  }
});

function SessionDetailComponent() {
  const { projectName, sessionId } = Route.useParams();
  const { imageIndex, folderPath, filePath } = Route.useSearch();

  return (
    <SessionDetailPage
      projectName={projectName}
      sessionId={sessionId}
      imageIndex={imageIndex}
      folderPath={folderPath}
      filePath={filePath}
    />
  );
}
