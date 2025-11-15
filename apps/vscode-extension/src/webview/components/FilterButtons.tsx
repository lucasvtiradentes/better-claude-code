import { Cpu, User, Wrench } from 'lucide-react';
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
        icon={<Cpu size={18} strokeWidth={showAssistantMessages ? 3 : 2} className="transition-all" />}
      />

      <FilterButton
        isActive={showUserMessages}
        onClick={onToggleUser}
        title="Your messages"
        ariaLabel="Your messages"
        icon={<User size={18} strokeWidth={showUserMessages ? 3 : 2} className="transition-all" />}
      />

      <FilterButton
        isActive={showToolCalls}
        onClick={onToggleToolCalls}
        title="Tool calls"
        ariaLabel="Tool calls"
        icon={<Wrench size={18} strokeWidth={showToolCalls ? 3 : 2} className="transition-all" />}
      />
    </div>
  );
};
