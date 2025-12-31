import { FileCheck, FileCode, FileText, MoreVertical, PackageOpen, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/lib/ui-components';

type SessionActionsMenuProps = {
  hasCompacted: boolean;
  onOpenRaw: () => void;
  onDeleteSession: () => void;
  onCompactSession: () => void;
  onOpenParsed?: () => void;
  onOpenSummary?: () => void;
};

export const SessionActionsMenu = ({
  hasCompacted,
  onOpenRaw,
  onDeleteSession,
  onCompactSession,
  onOpenParsed,
  onOpenSummary
}: SessionActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
          title="Session actions"
        >
          <MoreVertical size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1e1e1e] border-[#3f3f46] text-[#e4e4e7]">
        <DropdownMenuItem onClick={onOpenRaw} className="cursor-pointer hover:bg-[#2a2d2e] focus:bg-[#2a2d2e]">
          <FileCode className="mr-2 h-4 w-4" />
          Open raw JSONL
        </DropdownMenuItem>

        {!hasCompacted && (
          <DropdownMenuItem onClick={onCompactSession} className="cursor-pointer hover:bg-[#2a2d2e] focus:bg-[#2a2d2e]">
            <PackageOpen className="mr-2 h-4 w-4" />
            Compact session
          </DropdownMenuItem>
        )}

        {hasCompacted && onOpenParsed && (
          <DropdownMenuItem onClick={onOpenParsed} className="cursor-pointer hover:bg-[#2a2d2e] focus:bg-[#2a2d2e]">
            <FileText className="mr-2 h-4 w-4" />
            Open parsed
          </DropdownMenuItem>
        )}

        {hasCompacted && onOpenSummary && (
          <DropdownMenuItem onClick={onOpenSummary} className="cursor-pointer hover:bg-[#2a2d2e] focus:bg-[#2a2d2e]">
            <FileCheck className="mr-2 h-4 w-4" />
            Open summary
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-[#3f3f46]" />

        <DropdownMenuItem
          onClick={onDeleteSession}
          className="text-[#f87171] hover:text-[#f87171] focus:text-[#f87171] cursor-pointer hover:bg-[#2a2d2e] focus:bg-[#2a2d2e]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
