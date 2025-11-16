import {
  SessionCard as SessionCardComponent,
  type SessionCardData,
  type SessionLabel
} from '@better-claude-code/ui-components';
import type { GetApiSessionsProjectName200GroupsItemItemsItem } from '@/api/_generated/schemas';
import { useSettingsStore } from '@/common/stores/settings-store';

type SessionCardProps = {
  session: GetApiSessionsProjectName200GroupsItemItemsItem;
  projectName: string;
  onClick: () => void;
  isActive?: boolean;
  groupKey?: string;
  displaySettings?: {
    showTokenPercentage: boolean;
    showAttachments: boolean;
  };
  onDelete?: (sessionId: string) => void;
  onLabelToggle?: (sessionId: string, labelId: string) => void;
};

export const SessionCard = (props: SessionCardProps) => {
  const settingsData = useSettingsStore((state) => state.settings);
  const settings = settingsData?.sessions;

  const mappedSession: SessionCardData = {
    id: props.session.id,
    title: props.session.title,
    createdAt: props.session.createdAt,
    modifiedAt: props.session.modifiedAt,
    messageCount: props.session.messageCount,
    tokenPercentage: props.session.tokenPercentage,
    imageCount: props.session.imageCount,
    customCommandCount: props.session.customCommandCount,
    filesOrFoldersCount: props.session.filesOrFoldersCount,
    urlCount: props.session.urlCount,
    searchMatchCount: props.session.searchMatchCount,
    labels: props.session.labels
  };

  const mappedLabels: SessionLabel[] =
    settings?.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color
    })) || [];

  return (
    <SessionCardComponent
      session={mappedSession}
      onClick={props.onClick}
      isActive={props.isActive}
      groupKey={props.groupKey}
      displaySettings={props.displaySettings}
      labels={mappedLabels}
      onDelete={props.onDelete}
      onLabelToggle={props.onLabelToggle}
    />
  );
};
