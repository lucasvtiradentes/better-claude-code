import { navigateTo, state } from '../../app.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function applyCommonFormatting(text) {
  let formatted = text;

  formatted = formatted.replace(/\[Image #(\d+)\]/g, (_m, num) => {
    return `<span class="image-reference">[Image #${num}]</span>`;
  });

  formatted = formatted.replace(/(^|\s)@([^\s<>]+)/g, (_m, prefix, path) => {
    return `${prefix}<span class="file-reference" onclick="alert('@${path}')">@${path}</span>`;
  });

  formatted = formatted.replace(/ultrathink/gi, '<span class="rainbow-text">ultrathink</span>');

  return formatted;
}

function formatMessage(text) {
  let formatted = escapeHtml(text).replace(/\\/g, '');

  formatted = formatted.replace(/\[Tool: ([^\]]+)\] (\/[^\s<>,]+)/g, (_m, tool, path) => {
    return `[Tool: ${tool}] <span class="file-reference" onclick="alert('${path}')">${path}</span>`;
  });

  formatted = formatted.replace(/pattern: "([^"]+)"/g, (_m, pattern) => {
    return `pattern: "<span class="file-reference">${pattern}</span>"`;
  });

  formatted = formatted.replace(/path: (\/[^\s<>,]+)/g, (_m, path) => {
    return `path: <span class="file-reference" onclick="alert('${path}')">${path}</span>`;
  });

  formatted = formatted.replace(/\[Tool: ([^\]]+)\] "([^"]+)"/g, (_m, tool, query) => {
    return `[Tool: ${tool}] "<span class="file-reference">${query}</span>"`;
  });

  formatted = applyCommonFormatting(formatted);

  formatted = formatted.replace(/\n---\n/g, '<div class="message-separator"></div>');

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

function formatTitle(title) {
  return applyCommonFormatting(title);
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
          <div class="item-name">${formatTitle(session.title)}</div>
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

let showUserMessages = localStorage.getItem('showUserMessages') !== 'false';
let showAssistantMessages = localStorage.getItem('showAssistantMessages') !== 'false';
let showToolCalls = localStorage.getItem('showToolCalls') !== 'false';

function refreshSession() {
  const contentBody = document.getElementById('contentBody');
  const scrollPos = contentBody ? contentBody.scrollTop : 0;

  const currentUrl = new URLSearchParams(window.location.search);
  const repoId = currentUrl.get('repo');
  const sessionId = currentUrl.get('sessionId');

  if (repoId && sessionId) {
    renderSession(repoId, sessionId).then(() => {
      if (contentBody) {
        contentBody.scrollTop = scrollPos;
      }
    });
  }
}

window.toggleUserMessages = function() {
  showUserMessages = !showUserMessages;
  localStorage.setItem('showUserMessages', showUserMessages);
  refreshSession();
};

window.toggleAssistantMessages = function() {
  showAssistantMessages = !showAssistantMessages;
  localStorage.setItem('showAssistantMessages', showAssistantMessages);
  refreshSession();
};

window.toggleToolCalls = function() {
  showToolCalls = !showToolCalls;
  localStorage.setItem('showToolCalls', showToolCalls);
  refreshSession();
};

function saveScrollPosition(sessionId) {
  const contentBody = document.getElementById('contentBody');
  if (contentBody) {
    localStorage.setItem(`scroll_${sessionId}`, contentBody.scrollTop);
  }
}

function restoreScrollPosition(sessionId) {
  const savedScroll = localStorage.getItem(`scroll_${sessionId}`);
  if (savedScroll) {
    const contentBody = document.getElementById('contentBody');
    if (contentBody) {
      contentBody.scrollTop = parseInt(savedScroll, 10);
    }
  }
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
  document.getElementById('contentHeader').innerHTML = `
    <span>Session - ${sessionId.slice(-12)}</span>
    <div class="filter-controls">
      <button class="filter-btn ${showAssistantMessages ? 'active' : ''}" onclick="window.toggleAssistantMessages()" data-tooltip="Claude Code messages">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
          <rect x="9" y="9" width="6" height="6"/>
          <line x1="9" y1="1" x2="9" y2="4"/>
          <line x1="15" y1="1" x2="15" y2="4"/>
          <line x1="9" y1="20" x2="9" y2="23"/>
          <line x1="15" y1="20" x2="15" y2="23"/>
          <line x1="20" y1="9" x2="23" y2="9"/>
          <line x1="20" y1="15" x2="23" y2="15"/>
          <line x1="1" y1="9" x2="4" y2="9"/>
          <line x1="1" y1="15" x2="4" y2="15"/>
        </svg>
      </button>
      <button class="filter-btn ${showUserMessages ? 'active' : ''}" onclick="window.toggleUserMessages()" data-tooltip="Your messages">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        </svg>
      </button>
      <button class="filter-btn ${showToolCalls ? 'active' : ''}" onclick="window.toggleToolCalls()" data-tooltip="Tool calls">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </button>
    </div>
  `;
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

    let filteredMessages = data.messages;

    if (!showUserMessages) {
      filteredMessages = filteredMessages.filter(msg => msg.type !== 'user');
    }

    if (!showAssistantMessages) {
      filteredMessages = filteredMessages.filter(msg => msg.type !== 'assistant');
    }

    filteredMessages = filteredMessages.map(msg => {
      if (!showToolCalls) {
        const lines = msg.content.split('\n');
        const filtered = lines.filter(line => !line.trim().startsWith('[Tool:'));

        let cleaned = filtered.join('\n');

        while (cleaned.includes('---\n---')) {
          cleaned = cleaned.replace(/---\n---/g, '---');
        }

        cleaned = cleaned
          .split('\n---\n')
          .filter(part => part.trim().length > 0)
          .join('\n---\n')
          .replace(/^\n*---\n*/g, '')
          .replace(/\n*---\n*$/g, '')
          .trim();

        return { ...msg, content: cleaned };
      }
      return msg;
    }).filter(msg => msg.content.trim().length > 0);

    document.getElementById('contentBody').innerHTML = `
      <div class="messages">
        ${filteredMessages.map(msg => `
          <div class="message ${msg.type}">
            <div class="message-header">${msg.type === 'user' ? 'You' : 'Claude Code'}</div>
            <div class="message-content">${formatMessage(msg.content)}</div>
          </div>
        `).join('')}
      </div>
    `;

    const contentBody = document.getElementById('contentBody');
    const savedScroll = localStorage.getItem(`scroll_${sessionId}`);

    if (savedScroll) {
      restoreScrollPosition(sessionId);
    } else {
      contentBody.scrollTop = contentBody.scrollHeight;
    }

    let scrollTimeout;
    contentBody.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => saveScrollPosition(sessionId), 300);
    });

    window.addEventListener('beforeunload', () => saveScrollPosition(sessionId));
  } catch (error) {
    document.getElementById('contentBody').innerHTML = '<div class="empty-state">Error loading session</div>';
  }
}
