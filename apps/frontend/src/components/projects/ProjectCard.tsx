import type { Project } from '@bcc/shared';
import { GitBranch, Github } from 'lucide-react';

type ProjectCardProps = {
  project: Project;
  onClick: () => void;
  isActive?: boolean;
};

export const ProjectCard = ({ project, onClick, isActive }: ProjectCardProps) => {
  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.githubUrl) {
      window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 cursor-pointer
        border-b border-[#2d2d30] transition-all duration-100
        hover:bg-[#2a2d2e]
        ${isActive ? 'bg-[#094771]' : ''}
      `}
    >
      <div className="text-sm font-semibold mb-1 break-words line-clamp-2">{project.name}</div>
      <div className="text-[11px] text-[#858585] mb-1.5 break-all font-[Courier_New,monospace]">{project.path}</div>
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
              <Github size={14} />
            </button>
          ) : (
            project.isGitRepo && (
              <span className="cursor-default" title="This project is a Git repository">
                <GitBranch size={14} className="text-[#0e639c]" />
              </span>
            )
          )}
        </div>
      </div>
    </button>
  );
};
