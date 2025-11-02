import type { TimeGroup } from './types.js';

export const getTimeGroup = (timestamp: number): TimeGroup => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = yesterday.getTime();

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const thisWeekStart = weekStart.getTime();

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthStart = monthStart.getTime();

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

  if (timestamp >= todayStart) return 'today';
  if (timestamp >= yesterdayStart) return 'yesterday';
  if (timestamp >= thisWeekStart) return 'this-week';
  if (timestamp >= thisMonthStart) return 'this-month';
  if (timestamp >= lastMonthStart.getTime() && timestamp <= lastMonthEnd.getTime()) {
    return 'last-month';
  }
  return 'older';
};

export const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This Week',
  'this-month': 'This Month',
  'last-month': 'Last Month',
  older: 'Older'
};

export const TIME_GROUP_ORDER: TimeGroup[] = ['today', 'yesterday', 'this-week', 'this-month', 'last-month', 'older'];
