import { FilterButton } from './FilterButton';

type FilterButtonsProps = {
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
  onToggleUser: () => void;
  onToggleAssistant: () => void;
  onToggleToolCalls: () => void;
};

export const FilterButtons = ({
  showUserMessages,
  showAssistantMessages,
  showToolCalls,
  onToggleUser,
  onToggleAssistant,
  onToggleToolCalls
}: FilterButtonsProps) => {
  return (
    <div className="flex items-center gap-2">
      <FilterButton
        isActive={showAssistantMessages}
        onClick={onToggleAssistant}
        title="Claude Code messages"
        ariaLabel="Claude Code messages"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={showAssistantMessages ? '3' : '2'}
            className="transition-all"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
          </svg>
        }
      />

      <FilterButton
        isActive={showUserMessages}
        onClick={onToggleUser}
        title="Your messages"
        ariaLabel="Your messages"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={showUserMessages ? '3' : '2'}
            className="transition-all"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          </svg>
        }
      />

      <FilterButton
        isActive={showToolCalls}
        onClick={onToggleToolCalls}
        title="Tool calls"
        ariaLabel="Tool calls"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={showToolCalls ? '3' : '2'}
            className="transition-all"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        }
      />
    </div>
  );
};
