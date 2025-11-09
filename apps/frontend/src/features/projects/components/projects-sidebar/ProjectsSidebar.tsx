import {
  getSessionCountGroup,
  getTimeGroup,
  SESSION_COUNT_GROUP_LABELS,
  SESSION_COUNT_GROUP_ORDER,
  TIME_GROUP_LABELS,
  TIME_GROUP_ORDER
} from '@better-claude-code/shared';
import { useMemo } from 'react';
import { usePatchApiSettingsProjectsProjectId } from '@/api';
import type { GetApiProjects200Item } from '@/api/_generated/schemas';
import { GroupCardItems } from '@/components/GroupCardItems';
import { MiddleSidebar } from '@/components/layout/MiddleSidebar';
import { useSettingsStore } from '@/stores/settings-store';
import { ProjectCard } from './ProjectCard';
import { ProjectsHeader } from './ProjectsHeader';

type ProjectsSidebarProps = {
  projects: GetApiProjects200Item[] | undefined;
  isLoading: boolean;
  error: unknown;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  onSelectProject: (projectName: string) => void;
};

export const ProjectsSidebar = ({
  projects,
  isLoading,
  error,
  searchValue,
  onSearchChange,
  onSelectProject
}: ProjectsSidebarProps) => {
  const settingsData = useSettingsStore((state) => state.settings);
  const { mutate: updateLabels } = usePatchApiSettingsProjectsProjectId();

  const settings = settingsData?.projects;

  const handleLabelToggle = (projectId: string, labelId: string) => {
    const project = projects?.find((p) => p.id === projectId);
    if (!project) return;

    const currentLabels = project.labels || [];
    const hasLabel = currentLabels.includes(labelId);
    const newLabels = hasLabel ? [] : [labelId];

    updateLabels(
      { projectId, data: { labels: newLabels } },
      {
        onError: (error) => {
          console.error('Failed to toggle label:', error);
          alert('Failed to toggle label');
        }
      }
    );
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return projects;

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

  const groupedProjects = useMemo(() => {
    if (!filteredProjects || !settings) return undefined;

    if (settings.groupBy === 'date') {
      return filteredProjects.reduce(
        (acc, project) => {
          const group = getTimeGroup(project.lastModified);
          if (!acc[group]) acc[group] = [];
          acc[group].push(project);
          return acc;
        },
        {} as Record<string, GetApiProjects200Item[]>
      );
    }

    if (settings.groupBy === 'session-count') {
      return filteredProjects.reduce(
        (acc, project) => {
          const group = getSessionCountGroup(project.sessionsCount);
          if (!acc[group]) acc[group] = [];
          acc[group].push(project);
          return acc;
        },
        {} as Record<string, GetApiProjects200Item[]>
      );
    }

    if (settings.groupBy === 'label') {
      const grouped: Record<string, GetApiProjects200Item[]> = {
        'no-label': []
      };

      filteredProjects.forEach((project) => {
        if (!project.labels || project.labels.length === 0) {
          grouped['no-label'].push(project);
        } else {
          project.labels.forEach((labelId) => {
            const label = settings.labels.find((l) => l.id === labelId);
            if (label) {
              if (!grouped[label.id]) grouped[label.id] = [];
              grouped[label.id].push(project);
            }
          });
        }
      });

      return grouped;
    }

    return undefined;
  }, [filteredProjects, settings]);

  const getGroupLabel = (groupKey: string) => {
    if (!settings) return groupKey;

    if (settings.groupBy === 'date') {
      return TIME_GROUP_LABELS[groupKey as keyof typeof TIME_GROUP_LABELS] || groupKey;
    }

    if (settings.groupBy === 'session-count') {
      return SESSION_COUNT_GROUP_LABELS[groupKey as keyof typeof SESSION_COUNT_GROUP_LABELS] || groupKey;
    }

    if (settings.groupBy === 'label') {
      if (groupKey === 'no-label') return 'No Label';
      const label = settings.labels.find((l) => l.id === groupKey);
      return label ? label.name : groupKey;
    }

    return groupKey;
  };

  const getGroupLabelColor = (groupKey: string) => {
    if (!settings || settings.groupBy !== 'label' || groupKey === 'no-label') return undefined;
    const label = settings.labels.find((l) => l.id === groupKey);
    return label?.color;
  };

  const getGroupOrder = (): string[] => {
    if (!settings) return [];

    if (settings.groupBy === 'date') {
      return TIME_GROUP_ORDER;
    }

    if (settings.groupBy === 'session-count') {
      return SESSION_COUNT_GROUP_ORDER;
    }

    if (settings.groupBy === 'label') {
      const labelIds = settings.labels.map((l) => l.id);
      return [...labelIds, 'no-label'];
    }

    return [];
  };

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
        ) : (
          getGroupOrder().map((groupKey) => {
            const groupProjects = groupedProjects?.[groupKey];
            if (!groupProjects?.length) return null;

            return (
              <GroupCardItems
                key={groupKey}
                label={getGroupLabel(groupKey)}
                groupKey={groupKey as any}
                labelColor={getGroupLabelColor(groupKey)}
              >
                {groupProjects.map((project) => (
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
        )}
      </div>
    </MiddleSidebar>
  );
};
