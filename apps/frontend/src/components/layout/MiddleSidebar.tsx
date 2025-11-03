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
    <aside className="w-[420px] bg-card border-r border-border flex flex-col">
      {(title || backButton) && (
        <div className="px-4 py-4 border-b border-border flex items-center justify-between min-h-[48px]">
          {backButton && (
            <button
              type="button"
              onClick={backButton.onClick}
              className="px-2 py-1 bg-secondary rounded text-xs transition-all duration-100 hover:bg-accent"
            >
              {backButton.label}
            </button>
          )}
          {title && <span className="font-semibold text-sm text-foreground">{title}</span>}
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  );
};
