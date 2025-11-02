import type { Project } from '@bcc/shared';
import { Code, FolderOpen, GitBranch, Github, Terminal } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type ProjectCardProps = {
  project: Project;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
};

export const ProjectCard = ({ project, onClick, isActive, className }: ProjectCardProps) => {
  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.githubUrl) {
      window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAction = async (e: React.MouseEvent, action: 'openFolder' | 'openCodeEditor' | 'openTerminal') => {
    e.stopPropagation();
    try {
      await fetch(`/api/projects/${encodeURIComponent(project.id)}/action/${action}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={project.path}
      className={twMerge(
        className,
        `w-full text-left px-4 py-3 cursor-pointer border-b border-[#2d2d30] transition-all duration-100 hover:bg-[#2a2d2e]`,
        isActive ? 'bg-[#094771]' : ''
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-sm font-semibold break-words line-clamp-1">{project.name}</div>
        {project.isGitRepo && project.currentBranch && (
          <div className="text-[10px] text-[#858585] flex items-center gap-1 flex-shrink-0">
            <GitBranch size={10} />
            <span>{project.currentBranch}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#858585]">
        <span>{project.sessionsCount} sessions</span>
        <div className="flex items-center gap-1.5">
          {project.githubUrl ? (
            <button
              type="button"
              onClick={handleGitHubClick}
              className="hover:text-white transition-colors cursor-pointer"
              title="This project has a GitHub repository"
            >
              <Github size={16} />
            </button>
          ) : (
            project.isGitRepo && (
              <span className="cursor-default" title="This project is a Git repository">
                <GitBranch size={16} />
              </span>
            )
          )}
          {project.isGitRepo && (
            <button
              type="button"
              onClick={(e) => handleAction(e, 'openCodeEditor')}
              className="hover:text-white transition-colors cursor-pointer"
              title="Open code editor"
            >
              <Code size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => handleAction(e, 'openTerminal')}
            className="hover:text-white transition-colors cursor-pointer"
            title="Open terminal"
          >
            <Terminal size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'openFolder')}
            className="hover:text-white transition-colors cursor-pointer"
            title="Open folder"
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </div>
    </button>
  );
};
