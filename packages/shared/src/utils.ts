export { getGroupDate, getTimeGroup, TIME_GROUP_LABELS, TIME_GROUP_ORDER, TimeGroup } from './time-group.js';

export type SessionCountGroup = '0-10' | '10-50' | '50-200' | '200-500' | '500+';

export const getSessionCountGroup = (count: number): SessionCountGroup => {
  if (count <= 10) return '0-10';
  if (count <= 50) return '10-50';
  if (count <= 200) return '50-200';
  if (count <= 500) return '200-500';
  return '500+';
};

export const SESSION_COUNT_GROUP_LABELS: Record<SessionCountGroup, string> = {
  '0-10': '0-10 sessions',
  '10-50': '10-50 sessions',
  '50-200': '50-200 sessions',
  '200-500': '200-500 sessions',
  '500+': '500+ sessions'
};

export const SESSION_COUNT_GROUP_ORDER: SessionCountGroup[] = ['500+', '200-500', '50-200', '10-50', '0-10'];

export type TokenPercentageGroup = '0-25' | '25-50' | '50-75' | '75-100';

export const getTokenPercentageGroup = (percentage: number | undefined): TokenPercentageGroup => {
  if (!percentage) return '0-25';
  if (percentage <= 25) return '0-25';
  if (percentage <= 50) return '25-50';
  if (percentage <= 75) return '50-75';
  return '75-100';
};

export const TOKEN_PERCENTAGE_GROUP_LABELS: Record<TokenPercentageGroup, string> = {
  '0-25': '0-25%',
  '25-50': '25-50%',
  '50-75': '50-75%',
  '75-100': '75-100%'
};

export const TOKEN_PERCENTAGE_GROUP_ORDER: TokenPercentageGroup[] = ['75-100', '50-75', '25-50', '0-25'];
