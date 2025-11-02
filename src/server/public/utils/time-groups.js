export function getTimeGroup(timestamp) {
  const oneDay = 24 * 60 * 60 * 1000;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - oneDay;

  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayThisWeek = today - (daysFromMonday * oneDay);

  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  if (timestamp >= today) {
    return 'today';
  }

  if (timestamp >= yesterday) {
    return 'yesterday';
  }

  if (timestamp >= mondayThisWeek) {
    return 'this week';
  }

  if (timestamp >= firstDayThisMonth) {
    return 'this month';
  }

  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  if (timestamp >= firstDayLastMonth) {
    return 'last month';
  }

  return 'rest';
}

export function getGroupDate(groupName) {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  let date;
  if (groupName === 'today') {
    date = now;
  } else if (groupName === 'yesterday') {
    date = new Date(now.getTime() - oneDay);
  } else if (groupName === 'this week') {
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    date = new Date(now.getTime() - (daysFromMonday * oneDay));
  } else if (groupName === 'this month') {
    date = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (groupName === 'last month') {
    date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else {
    return '';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatGroupHeader(groupName, count) {
  const date = getGroupDate(groupName);
  const leftText = date ? `${groupName} (${date})` : groupName;

  return `<span>${leftText}</span><span class="group-count">(${count})</span>`;
}
