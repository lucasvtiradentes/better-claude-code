import type { ReactNode } from 'react';

type TimeGroupProps = {
  label: string;
  children: ReactNode;
};

export const TimeGroup = ({ label, children }: TimeGroupProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {label}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
};
