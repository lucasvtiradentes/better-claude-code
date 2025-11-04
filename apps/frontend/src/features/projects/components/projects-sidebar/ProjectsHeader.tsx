import { SearchInput } from '@/components/common/SearchInput';
import { useProjectsStore } from '@/stores/projects-store';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { ProjectSettingsModal } from '../projects-settings/ProjectSettingsModal';

type ProjectsHeaderProps = {
  projectCount: number;
};

export const ProjectsHeader = ({ projectCount }: ProjectsHeaderProps) => {
  const { search, setSearch } = useProjectsStore();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-4 border-b border-border space-y-3">
      <div className="flex items-center justify-center">
        <span className="font-semibold text-sm">Projects ({projectCount})</span>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="p-1.5 hover:bg-accent rounded transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {showModal && <ProjectSettingsModal onClose={() => setShowModal(false)} />}
    </div>
  );
};
