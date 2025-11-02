import type { Project } from '@bcc/shared';
import { TIME_GROUP_LABELS, TIME_GROUP_ORDER } from '@bcc/shared';
import { MiddleSidebar } from '../layout/MiddleSidebar';
import { TimeGroup } from '../TimeGroup';
import { ProjectCard } from './ProjectCard';

type ProjectsSidebarProps = {
  projects: Project[] | undefined;
  groupedProjects: Record<string, Project[]> | undefined;
  isLoading: boolean;
  error: unknown;
  onSelectProject: (projectName: string) => void;
};

export const ProjectsSidebar = ({
  projects,
  groupedProjects,
  isLoading,
  error,
  onSelectProject
}: ProjectsSidebarProps) => {
  return (
    <MiddleSidebar title={`Projects (${projects?.length || 0})`}>
      {error ? (
        <div className="p-4 text-red-500">Failed to load projects</div>
      ) : isLoading ? (
        <div className="p-4 text-[#858585]">Loading projects...</div>
      ) : (
        TIME_GROUP_ORDER.map((timeGroup) => {
          const groupProjects = groupedProjects?.[timeGroup];
          if (!groupProjects?.length) return null;

          return (
            <TimeGroup key={timeGroup} label={TIME_GROUP_LABELS[timeGroup]} groupKey={timeGroup}>
              {groupProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => onSelectProject(project.id)} />
              ))}
            </TimeGroup>
          );
        })
      )}
    </MiddleSidebar>
  );
};
