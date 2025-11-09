import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { getGetApiProjectsQueryKey, usePostApiProjectsProjectsProjectIdLabelsToggle } from '@/api';
import type { GetApiProjects200AnyOfItem, GetApiProjects200AnyOfTwoGroupsItem } from '@/api/_generated/schemas';
import { GroupCardItems } from '@/components/GroupCardItems';
import { MiddleSidebar } from '@/components/layout/MiddleSidebar';
import { useSettingsStore } from '@/stores/settings-store';
import { ProjectCard } from './ProjectCard';
import { ProjectsHeader } from './ProjectsHeader';

type ProjectsSidebarProps = {
  projects?: GetApiProjects200AnyOfItem[];
  groupedProjects?: GetApiProjects200AnyOfTwoGroupsItem[];
  isLoading: boolean;
  error: unknown;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  onSelectProject: (projectName: string) => void;
};

export const ProjectsSidebar = ({
  projects,
  groupedProjects,
  isLoading,
  error,
  searchValue,
  onSearchChange,
  onSelectProject
}: ProjectsSidebarProps) => {
  const settingsData = useSettingsStore((state) => state.settings);
  const queryClient = useQueryClient();
  const { mutate: toggleLabel } = usePostApiProjectsProjectsProjectIdLabelsToggle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiProjectsQueryKey()
        });
      },
      onError: (error) => {
        console.error('Failed to toggle label:', error);
        toast.error('Failed to toggle label');
      }
    }
  });

  const settings = settingsData?.projects;

  const handleLabelToggle = (projectId: string, labelId: string) => {
    toggleLabel({ projectId, data: { labelId } });
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return undefined;

    let filtered = projects;

    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(searchLower) || p.path.toLowerCase().includes(searchLower)
      );
    }

    filtered = filtered.filter((p) => !p.hidden);

    return filtered;
  }, [projects, searchValue]);

  return (
    <MiddleSidebar>
      <ProjectsHeader
        projectCount={filteredProjects?.length || 0}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4 text-red-500">Failed to load projects</div>
        ) : isLoading ? (
          <div className="p-4 text-muted-foreground">Loading projects...</div>
        ) : groupedProjects ? (
          groupedProjects.map((group) => {
            if (!group.items?.length) return null;

            return (
              <GroupCardItems
                key={group.key}
                label={group.label}
                groupKey={group.key as any}
                labelColor={group.color || undefined}
              >
                {group.items.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onSelectProject(project.id)}
                    displaySettings={settings?.display}
                    onLabelToggle={handleLabelToggle}
                  />
                ))}
              </GroupCardItems>
            );
          })
        ) : null}
      </div>
    </MiddleSidebar>
  );
};
