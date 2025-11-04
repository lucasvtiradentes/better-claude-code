import { createFileRoute } from '@tanstack/react-router';
import { ProjectsPage, ProjectsSearchParams } from '@/features/projects/pages/projects.page';

export const Route = createFileRoute('/projects')({
  component: ProjectsComponent,
  validateSearch: (search: Record<string, unknown>): ProjectsSearchParams => ({
    project: (search.project as string) || undefined,
    sessionId: (search.sessionId as string) || undefined,
    imageIndex: (search.imageIndex as number) || undefined,
    folderPath: (search.folderPath as string) || undefined,
    filePath: (search.filePath as string) || undefined,
    search: (search.search as string) || undefined
  })
});

function ProjectsComponent() {
  const searchParams = Route.useSearch();

  return <ProjectsPage searchParams={searchParams} />;
}
