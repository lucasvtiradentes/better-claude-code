enum SessionCountGroup {
  '0-10' = '0-10',
  '10-50' = '10-50',
  '50-200' = '50-200',
  '200-500' = '200-500',
  '500+' = '500+'
}

export const getSessionCountGroup = (count: number): SessionCountGroup => {
  if (count <= 10) return SessionCountGroup['0-10'];
  if (count <= 50) return SessionCountGroup['10-50'];
  if (count <= 200) return SessionCountGroup['50-200'];
  if (count <= 500) return SessionCountGroup['200-500'];
  return SessionCountGroup['500+'];
};

export const SESSION_COUNT_GROUP_LABELS: Record<SessionCountGroup, string> = {
  '0-10': '0-10 sessions',
  '10-50': '10-50 sessions',
  '50-200': '50-200 sessions',
  '200-500': '200-500 sessions',
  '500+': '500+ sessions'
};

export const SESSION_COUNT_GROUP_ORDER: SessionCountGroup[] = [
  SessionCountGroup['500+'],
  SessionCountGroup['200-500'],
  SessionCountGroup['50-200'],
  SessionCountGroup['10-50'],
  SessionCountGroup['0-10']
];
