import type { LucideIcon } from 'lucide-react';

type IconWithBadgeProps = {
  icon: LucideIcon;
  count: number;
  label: string;
};

export const IconWithBadge = ({ icon: Icon, count, label }: IconWithBadgeProps) => {
  return (
    <span className="flex flex-col items-center justify-center gap-0.5 hover:cursor-help" title={label}>
      <Icon size={14} />
      <span className="text-[9px] font-semibold leading-none">{count}</span>
    </span>
  );
};
