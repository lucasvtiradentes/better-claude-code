import type { TimeGroup } from '@better-claude-code/shared';

export function getGroupDate(groupName: TimeGroup): string {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  let date: Date;
  if (groupName === 'today') {
    date = now;
  } else if (groupName === 'yesterday') {
    date = new Date(now.getTime() - oneDay);
  } else if (groupName === 'this-week') {
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    date = new Date(now.getTime() - daysFromMonday * oneDay);
  } else if (groupName === 'this-month') {
    date = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (groupName === 'last-month') {
    date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
