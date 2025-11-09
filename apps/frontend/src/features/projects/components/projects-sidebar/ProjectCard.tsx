import { ProjectAction } from '@better-claude-code/shared';
import { Code, FolderOpen, Github, MessageSquare, MoreHorizontal, Tag, Terminal } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { usePostApiProjectsProjectIdActionAction } from '@/api';
import type { GetApiProjects200Item } from '@/api/_generated/schemas';
import { useSettingsStore } from '@/stores/settings-store';
import { IconWithBadge } from '@/components/IconWithBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getLabelActiveColor } from '@/features/projects/utils/message-patterns';

type ProjectCardProps = {
  project: GetApiProjects200Item;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
  displaySettings?: {
    showSessionCount: boolean;
    showCurrentBranch: boolean;
    showActionButtons: boolean;
  };
  onLabelToggle?: (projectId: string, labelId: string) => void;
};

export const ProjectCard = ({
  project,
  onClick,
  isActive,
  className,
  displaySettings = {
    showSessionCount: true,
    showCurrentBranch: true,
    showActionButtons: true
  },
  onLabelToggle
}: ProjectCardProps) => {
  const settingsData = useSettingsStore((state) => state.settings);
  const { mutate: executeAction } = usePostApiProjectsProjectIdActionAction();

  const settings = settingsData?.projects;

  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.githubUrl) {
      window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAction = (e: React.MouseEvent, action: ProjectAction) => {
    e.stopPropagation();
    executeAction({ projectId: project.id, action });
  };

  const handleMenuAction = (e: React.MouseEvent<HTMLDivElement>, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={twMerge(
        className,
        `relative w-full text-left px-4 py-3 border-b border-border transition-all duration-100 hover:bg-accent group`,
        isActive ? 'bg-primary/20' : ''
      )}
    >
      <button type="button" onClick={onClick} title={project.path} className="w-full text-left">
        <div className="mb-1">
          <div className="text-sm font-semibold wrap-break-word line-clamp-1 pr-8">
            {project.name}
            {displaySettings.showCurrentBranch &&
              project.currentBranch &&
              project.currentBranch !== 'main' &&
              project.currentBranch !== 'master' && (
                <span className="text-[10px] text-muted-foreground font-normal ml-1">({project.currentBranch})</span>
              )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {displaySettings.showSessionCount ? (
            <IconWithBadge
              icon={MessageSquare}
              count={project.sessionsCount}
              label={`${project.sessionsCount} sessions`}
            />
          ) : (
            <span></span>
          )}

          {displaySettings.showActionButtons && (
            <div className="flex items-center gap-1.5">
              {project.githubUrl && (
                <button
                  type="button"
                  onClick={handleGitHubClick}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Open GitHub repository"
                >
                  <Github size={16} />
                </button>
              )}
              {project.isGitRepo && (
                <button
                  type="button"
                  onClick={(e) => handleAction(e, ProjectAction.OPEN_EDITOR)}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Open code editor"
                >
                  <Code size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleAction(e, ProjectAction.OPEN_TERMINAL)}
                className="hover:text-white transition-colors cursor-pointer"
                title="Open terminal"
              >
                <Terminal size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => handleAction(e, ProjectAction.OPEN_FOLDER)}
                className="hover:text-white transition-colors cursor-pointer"
                title="Open folder"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          )}
        </div>
      </button>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1 hover:bg-accent rounded-sm"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e: React.MouseEvent<HTMLDivElement>) => handleMenuAction(e, onClick)}>
              Open project
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="h-4 w-4 mr-2" />
                Label
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {settings?.labels.length === 0 ? (
                  <DropdownMenuItem disabled>No labels available</DropdownMenuItem>
                ) : (
                  settings?.labels.map((label) => {
                    const isLabeled = project.labels?.includes(label.id);
                    return (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                          handleMenuAction(e, () => onLabelToggle?.(project.id, label.id))
                        }
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: label.color }} />
                          <span className="flex-1">{label.name}</span>
                          {isLabeled && <span className={getLabelActiveColor()}>✓</span>}
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
