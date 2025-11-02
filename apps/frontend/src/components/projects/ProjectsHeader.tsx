import { Search, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { useProjectsStore } from '../../stores/projects-store';
import { ProjectSettingsModal } from './ProjectSettingsModal';

type ProjectsHeaderProps = {
  projectCount: number;
};

export const ProjectsHeader = ({ projectCount }: ProjectsHeaderProps) => {
  const { settings, setSearch } = useProjectsStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-4 border-b border-[#3e3e42]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Projects ({projectCount})</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={settings?.search || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 px-3 py-1.5 bg-[#1e1e1e] border border-[#3e3e42] rounded text-sm focus:outline-none focus:border-[#007acc]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setSearch('');
                  }}
                  className="p-1.5 hover:bg-[#2a2d2e] rounded transition-colors"
                  title="Close search"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {!showSearch && (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="p-1.5 hover:bg-[#2a2d2e] rounded transition-colors"
                title="Search projects"
              >
                <Search size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="p-1.5 hover:bg-[#2a2d2e] rounded transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showModal && <ProjectSettingsModal onClose={() => setShowModal(false)} />}
    </div>
  );
};
