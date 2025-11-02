import type { ReactNode, RefObject } from 'react';

type MiddleSidebarProps = {
  title?: string;
  backButton?: {
    label: string;
    onClick: () => void;
  };
  children: ReactNode;
  hidden?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
};

export const MiddleSidebar = ({ title, backButton, children, hidden = false, scrollRef }: MiddleSidebarProps) => {
  if (hidden) {
    return null;
  }

  return (
    <aside className="w-[420px] bg-[#252526] border-r border-[#3e3e42] flex flex-col">
      {(title || backButton) && (
        <div className="px-4 py-4 border-b border-[#3e3e42] flex items-center justify-between min-h-[48px]">
          {backButton && (
            <button
              type="button"
              onClick={backButton.onClick}
              className="px-2 py-1 bg-[#333333] rounded text-xs transition-all duration-100 hover:bg-[#404040]"
            >
              {backButton.label}
            </button>
          )}
          {title && <span className="font-semibold text-sm text-[#cccccc]">{title}</span>}
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  );
};
