import { getGroupDate, TimeGroup as TimeGroupEnum } from '@better-claude-code/shared';
import type { ReactNode } from 'react';
import { Children } from 'react';

type TimeGroupProps = {
  label: string;
  groupKey: TimeGroupEnum;
  children: ReactNode;
  labelColor?: string;
};

export const TimeGroup = ({ label, groupKey, children, labelColor }: TimeGroupProps) => {
  const count = Children.count(children);
  const date = getGroupDate(groupKey);
  const leftText = date ? `${label.toUpperCase()} (${date})` : label.toUpperCase();

  return (
    <div>
      <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase bg-background border-b border-border sticky top-0 z-10 flex justify-between items-center min-h-8">
        <span style={labelColor ? { color: labelColor } : undefined}>{leftText}</span>
        <span className="font-normal opacity-70">({count})</span>
      </div>
      <div>{children}</div>
    </div>
  );
};
