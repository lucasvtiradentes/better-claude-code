import type { GetApiSessionsProjectName200GroupsItemItemsItem } from '@/api';
import { FilterButtons } from '@/features/projects/components/FilterButtons';
import { SessionBadges } from '../sessions-sidebar/SessionBadges';

interface SessionChatHeaderProps {
  session?: GetApiSessionsProjectName200GroupsItemItemsItem;
}

export function SessionChatHeader({ session }: SessionChatHeaderProps) {
  return (
    <div className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {session && <SessionBadges session={session} showSearch />}
        </div>
      </div>
      <FilterButtons />
    </div>
  );
}
