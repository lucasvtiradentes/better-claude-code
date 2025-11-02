import { useFilterStore } from '../stores/filter-store';

export const FilterButtons = () => {
  const {
    showUserMessages,
    showAssistantMessages,
    showToolCalls,
    toggleUserMessages,
    toggleAssistantMessages,
    toggleToolCalls
  } = useFilterStore();

  const buttonClass = (active: boolean) =>
    `px-4 py-2 rounded-lg border transition-colors ${
      active
        ? 'bg-text-accent/20 border-text-accent text-text-accent'
        : 'bg-surface border-border text-text-secondary hover:border-text-accent/50'
    }`;

  return (
    <div className="flex gap-3">
      <button onClick={toggleUserMessages} className={buttonClass(showUserMessages)}>
        User Messages
      </button>
      <button onClick={toggleAssistantMessages} className={buttonClass(showAssistantMessages)}>
        Assistant Messages
      </button>
      <button onClick={toggleToolCalls} className={buttonClass(showToolCalls)}>
        Tool Calls
      </button>
    </div>
  );
};
