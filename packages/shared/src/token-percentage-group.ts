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
