enum TokenPercentageGroup {
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
