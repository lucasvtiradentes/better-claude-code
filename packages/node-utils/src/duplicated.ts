export enum TimeGroup {
  LastHour = 'last-hour',
  Today = 'today',
  Yesterday = 'yesterday',
  ThisWeek = 'this-week',
  ThisMonth = 'this-month',
  LastMonth = 'last-month',
  Older = 'older'
}

export const TIME_GROUP_ORDER: TimeGroup[] = [
  TimeGroup.LastHour,
  TimeGroup.Today,
  TimeGroup.Yesterday,
  TimeGroup.ThisWeek,
  TimeGroup.ThisMonth,
  TimeGroup.LastMonth,
  TimeGroup.Older
];

export const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  [TimeGroup.LastHour]: 'Last Hour',
  [TimeGroup.Today]: 'Today',
  [TimeGroup.Yesterday]: 'Yesterday',
  [TimeGroup.ThisWeek]: 'This Week',
  [TimeGroup.ThisMonth]: 'This Month',
  [TimeGroup.LastMonth]: 'Last Month',
  [TimeGroup.Older]: 'Older'
};

export const getTimeGroup = (timestamp: number): TimeGroup => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const lastHourStart = now - oneHour;

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

  if (timestamp >= lastHourStart) return TimeGroup.LastHour;
  if (timestamp >= todayStart) return TimeGroup.Today;
  if (timestamp >= yesterdayStart) return TimeGroup.Yesterday;
  if (timestamp >= thisWeekStart) return TimeGroup.ThisWeek;
  if (timestamp >= thisMonthStart) return TimeGroup.ThisMonth;
  if (timestamp >= lastMonthStart.getTime() && timestamp <= lastMonthEnd.getTime()) {
    return TimeGroup.LastMonth;
  }
  return TimeGroup.Older;
};

export enum TokenPercentageGroup {
  '0-25' = '0-25',
  '25-50' = '25-50',
  '50-75' = '50-75',
  '75-100' = '75-100'
}

export const getTokenPercentageGroup = (percentage: number | undefined): TokenPercentageGroup => {
  if (!percentage) return TokenPercentageGroup['0-25'];
  if (percentage <= 25) return TokenPercentageGroup['0-25'];
  if (percentage <= 50) return TokenPercentageGroup['25-50'];
  if (percentage <= 75) return TokenPercentageGroup['50-75'];
  return TokenPercentageGroup['75-100'];
};

export const TOKEN_PERCENTAGE_GROUP_LABELS: Record<TokenPercentageGroup, string> = {
  [TokenPercentageGroup['0-25']]: '0-25%',
  [TokenPercentageGroup['25-50']]: '25-50%',
  [TokenPercentageGroup['50-75']]: '50-75%',
  [TokenPercentageGroup['75-100']]: '75-100%'
};

export const TOKEN_PERCENTAGE_GROUP_ORDER: TokenPercentageGroup[] = [
  TokenPercentageGroup['75-100'],
  TokenPercentageGroup['50-75'],
  TokenPercentageGroup['25-50'],
  TokenPercentageGroup['0-25']
];
