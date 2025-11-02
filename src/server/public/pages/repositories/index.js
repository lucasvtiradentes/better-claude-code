import { navigateTo, state } from '../../app.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessage(text) {
  let formatted = escapeHtml(text).replace(/\\/g, '');

  formatted = formatted.replace(/\[Tool: ([^\]]+)\] (\/[^\s<>,]+)/g, (match, tool, path) => {
    return `[Tool: ${tool}] <span class="file-reference" onclick="alert('${path}')">${path}</span>`;
  });

  formatted = formatted.replace(/pattern: "([^"]+)"/g, (match, pattern) => {
    return `pattern: "<span class="file-reference">${pattern}</span>"`;
  });

  formatted = formatted.replace(/path: (\/[^\s<>,]+)/g, (match, path) => {
    return `path: <span class="file-reference" onclick="alert('${path}')">${path}</span>`;
  });

  formatted = formatted.replace(/\[Tool: ([^\]]+)\] "([^"]+)"/g, (match, tool, query) => {
    return `[Tool: ${tool}] "<span class="file-reference">${query}</span>"`;
  });

  formatted = formatted.replace(/@([^\s<>]+)/g, (match, path) => {
    return `<span class="file-reference" onclick="alert('${path}')">${match}</span>`;
  });

  formatted = formatted.replace(/ultrathink/gi, '<span class="rainbow-text">ultrathink</span>');

  formatted = formatted.replace(/\n/g, '<br />');

  return formatted;
}

function getTimeGroup(timestamp) {
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

function groupReposByTime(repos) {
  const groups = {
    today: [],
    yesterday: [],
    'this week': [],
    'this month': [],
    'last month': [],
    rest: []
  };

  repos.forEach(repo => {
    const group = getTimeGroup(repo.lastModified);
    groups[group].push(repo);
  });

  return groups;
}

function renderReposList(repos) {
  const groups = groupReposByTime(repos);
  let html = '';

  for (const [groupName, groupRepos] of Object.entries(groups)) {
    if (groupRepos.length === 0) continue;

    html += `<div class="group-header">${groupName}</div>`;
    html += groupRepos.map(repo => {
      const escapedName = repo.name.replace(/'/g, '&#39;');
      return `
        <div class="list-item" onclick="window.selectRepo('${repo.id}', '${escapedName}')">
          <div class="item-name">${repo.name}</div>
          <div class="item-path">${repo.fullPath}</div>
          <div class="item-meta">
            <span>${repo.sessionCount} sessions</span>
            ${repo.isGitRepo ? '<span class="git-badge">git repo</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  return html;
}

function groupSessionsByTime(sessions) {
  const groups = {
    today: [],
    yesterday: [],
    'this week': [],
    'this month': [],
    'last month': [],
    rest: []
  };

  sessions.forEach(session => {
    const group = getTimeGroup(session.timestamp);
    groups[group].push(session);
  });

  return groups;
}

function renderSessionsList(sessions, selectedSessionId = null) {
  const groups = groupSessionsByTime(sessions);
  let html = '';

  for (const [groupName, groupSessions] of Object.entries(groups)) {
    if (groupSessions.length === 0) continue;

    html += `<div class="group-header">${groupName}</div>`;
    html += groupSessions.map(session => {
      const date = new Date(session.timestamp).toLocaleDateString();
      const tokenBadge = session.tokenPercentage ? `${session.tokenPercentage}%` : '';
      const isActive = session.id === selectedSessionId ? 'active' : '';

      return `
        <div class="list-item ${isActive}" onclick="window.selectSession('${state.selectedRepo}', '${session.id}')">
          <div class="item-name">${session.title}</div>
          <div class="item-meta">
            <span>${session.userCount} you</span>
            <span>${session.assistantCount} cc</span>
            ${tokenBadge ? `<span>${tokenBadge}</span>` : ''}
            <span>${date}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  return html;
}

export async function renderRepositories() {
  document.getElementById('mainSidebar').classList.remove('hidden');
  document.getElementById('sidebarHeader').innerHTML = '<span class="sidebar-title">Repositories</span>';
  document.getElementById('sidebarContent').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('contentHeader').textContent = 'Repositories';
  document.getElementById('contentBody').innerHTML = '<div class="empty-state">Select a repository</div>';

  try {
    const res = await fetch('/api/repos');
    const data = await res.json();
    state.repos = data.repos;

    if (data.repos.length === 0) {
      document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">No repositories found</div>';
      return;
    }

    document.getElementById('sidebarContent').innerHTML = renderReposList(state.repos);
  } catch (error) {
    document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">Error loading repos</div>';
  }
}

export function selectRepo(repoId) {
  navigateTo(`/repositories?repo=${encodeURIComponent(repoId)}`);
}

export async function renderSessions(repoId) {
  document.getElementById('mainSidebar').classList.remove('hidden');
  state.selectedRepo = repoId;

  if (state.repos.length === 0) {
    try {
      const reposRes = await fetch('/api/repos');
      const reposData = await reposRes.json();
      state.repos = reposData.repos;
    } catch (error) {
      console.error('Failed to load repos', error);
    }
  }

  const repo = state.repos.find(r => r.id === repoId);
  const repoName = repo ? repo.name : repoId;

  document.getElementById('sidebarHeader').innerHTML = `
    <span class="back-button" onclick="window.navigateTo('/repositories')">← Back</span>
    <span class="sidebar-title">${repoName}</span>
  `;
  document.getElementById('sidebarContent').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('contentHeader').textContent = 'Sessions';
  document.getElementById('contentBody').innerHTML = '<div class="empty-state">Select a session</div>';

  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(repoId)}`);
    const data = await res.json();

    if (data.sessions.length === 0) {
      document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">No sessions found</div>';
      return;
    }

    document.getElementById('sidebarContent').innerHTML = renderSessionsList(data.sessions);
  } catch (error) {
    document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">Error loading sessions</div>';
  }
}

export function selectSession(repoId, sessionId) {
  navigateTo(`/repositories?repo=${encodeURIComponent(repoId)}&sessionId=${sessionId}`);
}

export async function renderSession(repoId, sessionId) {
  document.getElementById('mainSidebar').classList.remove('hidden');
  state.selectedRepo = repoId;

  if (state.repos.length === 0) {
    try {
      const reposRes = await fetch('/api/repos');
      const reposData = await reposRes.json();
      state.repos = reposData.repos;
    } catch (error) {
      console.error('Failed to load repos', error);
    }
  }

  const repo = state.repos.find(r => r.id === repoId);
  const repoName = repo ? repo.name : repoId;

  document.getElementById('sidebarHeader').innerHTML = `
    <span class="back-button" onclick="window.navigateTo('/repositories?repo=${encodeURIComponent(repoId)}')">← Back</span>
    <span class="sidebar-title">${repoName}</span>
  `;
  document.getElementById('contentHeader').textContent = `Session - ${sessionId.slice(-12)}`;
  document.getElementById('contentBody').innerHTML = '<div class="loading">Loading...</div>';

  try {
    const sessionsRes = await fetch(`/api/sessions/${encodeURIComponent(repoId)}`);
    const sessionsData = await sessionsRes.json();

    document.getElementById('sidebarContent').innerHTML = renderSessionsList(sessionsData.sessions, sessionId);

    const res = await fetch(`/api/sessions/${encodeURIComponent(repoId)}/${sessionId}`);
    const data = await res.json();

    if (data.messages.length === 0) {
      document.getElementById('contentBody').innerHTML = '<div class="empty-state">No messages found</div>';
      return;
    }

    document.getElementById('contentBody').innerHTML = `
      <div class="messages">
        ${data.messages.map(msg => `
          <div class="message ${msg.type}">
            <div class="message-header">${msg.type === 'user' ? 'You' : 'Claude Code'}</div>
            <div class="message-content">${formatMessage(msg.content)}</div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('contentBody').scrollTop = document.getElementById('contentBody').scrollHeight;
  } catch (error) {
    document.getElementById('contentBody').innerHTML = '<div class="empty-state">Error loading session</div>';
  }
}
