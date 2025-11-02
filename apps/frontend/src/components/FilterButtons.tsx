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
    `
      bg-[#2a2a2a] border border-[#3e3e42] rounded-md
      w-8 h-8 flex items-center justify-center
      cursor-pointer transition-all duration-200
      relative group
      ${active ? 'text-[#007acc]' : 'text-[#858585] hover:text-[#007acc]'}
    `;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleAssistantMessages}
        className={buttonClass(showAssistantMessages)}
        title="Claude Code messages"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={showAssistantMessages ? '3' : '2'}
          className="transition-all"
          aria-label="Claude Code messages"
        >
          <title>Claude Code messages</title>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
        </svg>
      </button>

      <button
        type="button"
        onClick={toggleUserMessages}
        className={buttonClass(showUserMessages)}
        title="Your messages"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={showUserMessages ? '3' : '2'}
          className="transition-all"
          aria-label="Your messages"
        >
          <title>Your messages</title>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      </button>

      <button type="button" onClick={toggleToolCalls} className={buttonClass(showToolCalls)} title="Tool calls">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={showToolCalls ? '3' : '2'}
          className="transition-all"
          aria-label="Tool calls"
        >
          <title>Tool calls</title>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </button>
    </div>
  );
};
