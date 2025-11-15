import type { ReactNode } from 'react';

type FilterButtonProps = {
  isActive: boolean;
  onClick: () => void;
  title: string;
  ariaLabel: string;
  icon: ReactNode;
};

export const FilterButton = ({ isActive, onClick, title, ariaLabel, icon }: FilterButtonProps) => {
  const buttonClass = `bg-card border border-border rounded-md w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 relative group ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`;

  return (
    <button type="button" onClick={onClick} className={buttonClass} title={title} aria-label={ariaLabel}>
      {icon}
    </button>
  );
};
