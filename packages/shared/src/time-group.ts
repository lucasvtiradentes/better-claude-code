export enum TimeGroup {
  Today = 'today',
  Yesterday = 'yesterday',
  ThisWeek = 'this-week',
  ThisMonth = 'this-month',
  LastMonth = 'last-month',
  Older = 'older'
}

export const TIME_GROUP_ORDER: TimeGroup[] = [
  TimeGroup.Today,
  TimeGroup.Yesterday,
  TimeGroup.ThisWeek,
  TimeGroup.ThisMonth,
  TimeGroup.LastMonth,
  TimeGroup.Older
];

export const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  [TimeGroup.Today]: 'Today',
  [TimeGroup.Yesterday]: 'Yesterday',
  [TimeGroup.ThisWeek]: 'This Week',
  [TimeGroup.ThisMonth]: 'This Month',
  [TimeGroup.LastMonth]: 'Last Month',
  [TimeGroup.Older]: 'Older'
};

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

  if (timestamp >= todayStart) return TimeGroup.Today;
  if (timestamp >= yesterdayStart) return TimeGroup.Yesterday;
  if (timestamp >= thisWeekStart) return TimeGroup.ThisWeek;
  if (timestamp >= thisMonthStart) return TimeGroup.ThisMonth;
  if (timestamp >= lastMonthStart.getTime() && timestamp <= lastMonthEnd.getTime()) {
    return TimeGroup.LastMonth;
  }
  return TimeGroup.Older;
};

export function getGroupDate(groupName: TimeGroup) {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  let date: Date;
  if (groupName === TimeGroup.Today) {
    date = now;
  } else if (groupName === TimeGroup.Yesterday) {
    date = new Date(now.getTime() - oneDay);
  } else if (groupName === TimeGroup.ThisWeek) {
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    date = new Date(now.getTime() - daysFromMonday * oneDay);
  } else if (groupName === TimeGroup.ThisMonth) {
    date = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (groupName === TimeGroup.LastMonth) {
    date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
