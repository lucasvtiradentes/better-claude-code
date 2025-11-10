import { FileText, Image, Link, Search, Terminal } from 'lucide-react';
import type { GetApiSessionsProjectName200ItemsItem } from '@/api/_generated/schemas';
import { IconWithBadge } from '@/common/components/IconWithBadge';

type SessionBadgesProps = {
  session: GetApiSessionsProjectName200ItemsItem;
  showSearch?: boolean;
};

export const SessionBadges = ({ session, showSearch = false }: SessionBadgesProps) => {
  return (
    <>
      {showSearch && session.searchMatchCount !== undefined && session.searchMatchCount > 0 && (
        <span className="text-primary">
          <IconWithBadge icon={Search} count={session.searchMatchCount} label={`${session.searchMatchCount} matches`} />
        </span>
      )}
      {session.imageCount !== undefined && session.imageCount > 0 && (
        <IconWithBadge icon={Image} count={session.imageCount} label={`${session.imageCount} images`} />
      )}
      {session.customCommandCount !== undefined && session.customCommandCount > 0 && (
        <IconWithBadge
          icon={Terminal}
          count={session.customCommandCount}
          label={`${session.customCommandCount} custom commands`}
        />
      )}
      {session.filesOrFoldersCount !== undefined && session.filesOrFoldersCount > 0 && (
        <IconWithBadge
          icon={FileText}
          count={session.filesOrFoldersCount}
          label={`${session.filesOrFoldersCount} files/folders`}
        />
      )}
      {session.urlCount !== undefined && session.urlCount > 0 && (
        <IconWithBadge icon={Link} count={session.urlCount} label={`${session.urlCount} URLs`} />
      )}
    </>
  );
};
