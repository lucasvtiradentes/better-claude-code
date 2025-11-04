import { SearchInput } from '@/components/SearchInput';
import { ArrowLeft, Code, Settings, Terminal } from 'lucide-react';
import { useProjectAction } from '../../../../api/use-projects';

type SessionsHeaderProps = {
  projectName: string;
  totalSessions: number;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  onSettingsClick: () => void;
  onBackClick: () => void;
  projectId: string;
  isGitRepo?: boolean;
};

export const SessionsHeader = ({
  projectName,
  totalSessions,
  searchValue,
  onSearchChange,
  onSettingsClick,
  onBackClick,
  projectId,
  isGitRepo
}: SessionsHeaderProps) => {
  const { mutate: executeAction } = useProjectAction();

  const handleAction = (action: 'openCodeEditor' | 'openTerminal') => {
    executeAction({ projectId, action });
  };

  return (
    <div className="p-4 border-b border-border space-y-3">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBackClick}
          className="absolute left-0 p-1.5 hover:bg-accent rounded transition-colors"
          title="Back to projects"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-semibold text-sm">
          {projectName} ({totalSessions})
        </span>
        <div className="absolute right-0 flex items-center gap-1.5">
          {isGitRepo && (
            <button
              type="button"
              onClick={() => handleAction('openCodeEditor')}
              className="p-1.5 hover:bg-accent rounded transition-colors"
              title="Open code editor"
            >
              <Code size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleAction('openTerminal')}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title="Open terminal"
          >
            <Terminal size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput
          value={searchValue || ''}
          onChange={onSearchChange}
          placeholder="Search sessions..."
          debounce={500}
        />
        <button
          type="button"
          onClick={onSettingsClick}
          className="p-1.5 hover:bg-accent rounded transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
