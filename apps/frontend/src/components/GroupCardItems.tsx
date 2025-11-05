import { getGroupDate, TimeGroup } from '@better-claude-code/shared';
import type { ReactNode } from 'react';
import { Children } from 'react';

type GroupCardItemsProps = {
  label: string;
  groupKey: TimeGroup;
  children: ReactNode;
  labelColor?: string;
};

export const GroupCardItems = ({ label, groupKey, children, labelColor }: GroupCardItemsProps) => {
  const count = Children.count(children);
  const date = getGroupDate(groupKey);
  const leftText = date ? `${label.toUpperCase()} (${date})` : label.toUpperCase();

  return (
    <div>
      minha pica
      <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase bg-background border-b border-border sticky top-0 z-10 flex justify-between items-center min-h-8">
        <span style={labelColor ? { color: labelColor } : undefined}>{leftText}</span>
        <span className="font-normal opacity-70">({count})</span>
      </div>
      <div>{children}</div>
    </div>
  );
};
