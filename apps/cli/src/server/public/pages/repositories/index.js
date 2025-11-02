import { navigateTo, state } from '../../app.js';
import { getTimeGroup, formatGroupHeader } from '../../utils/time-groups.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function parseCommandFormat(text) {
  const commandNameMatch = text.match(/<command-name>\/?([^<]+)<\/command-name>/);
  const commandArgsMatch = text.match(/<command-args>([^<]+)<\/command-args>/);

  if (commandNameMatch) {
    const cmdName = commandNameMatch[1];
    const cmdArgs = commandArgsMatch ? commandArgsMatch[1] : '';

    const fullCommand = cmdArgs ? `/${cmdName} ${cmdArgs}` : `/${cmdName}`;
    return `<span class="command-text">${escapeHtml(fullCommand)}</span>`;
  }

  return null;
}

let sessionImages = {};

function applyCommonFormatting(text, includeClickHandlers = true) {
  let formatted = text;

  formatted = formatted.replace(/\[Image #(\d+)\]/g, (_m, num) => {
    const handler = includeClickHandlers ? ` onclick="window.showImage(${num})"` : '';
    return `<span class="image-reference"${handler}>[Image #${num}]</span>`;
  });

  formatted = formatted.replace(/(^|\s)@([^\s<>]+)/g, (_m, prefix, path) => {
    const handler = includeClickHandlers ? ` onclick="alert('@${path}')"` : '';
    return `${prefix}<span class="file-reference"${handler}>@${path}</span>`;
  });

  formatted = formatted.replace(/ultrathink/gi, '<span class="rainbow-text">ultrathink</span>');

  return formatted;
}

window.showImage = function(imageNumber) {
  const imageData = sessionImages[imageNumber];
  if (!imageData) {
    alert('Image not found');
    return;
  }

  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const imageTitle = document.getElementById('imageModalTitle');

  if (modal && modalImg) {
    modalImg.src = imageData;
    const totalImages = Object.keys(sessionImages).length;
    if (imageTitle) {
      imageTitle.textContent = `Image ${imageNumber} / ${totalImages}`;
    }
    modal.style.display = 'flex';

    const url = new URL(window.location);
    url.searchParams.set('imageIndex', imageNumber);
    window.history.pushState({}, '', url);
  }
};

window.closeImageModal = function() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';

    const url = new URL(window.location);
    url.searchParams.delete('imageIndex');
    window.history.pushState({}, '', url);
  }
};

window.navigateImage = function(direction) {
  const url = new URL(window.location);
  const currentIndex = parseInt(url.searchParams.get('imageIndex')) || 1;
  const totalImages = Object.keys(sessionImages).length;

  let newIndex = currentIndex + direction;
  if (newIndex < 1) newIndex = totalImages;
  if (newIndex > totalImages) newIndex = 1;

  window.showImage(newIndex);
};

document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('imageModal');
  if (modal && modal.style.display === 'flex') {
    if (e.key === 'ArrowLeft') {
      window.navigateImage(-1);
    } else if (e.key === 'ArrowRight') {
      window.navigateImage(1);
    } else if (e.key === 'Escape') {
      window.closeImageModal();
    }
  }
});

function formatMessage(text) {
  const parsedCommand = parseCommandFormat(text);
  if (parsedCommand) {
    return parsedCommand;
  }

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

    html += `<div class="group-header">${formatGroupHeader(groupName, groupRepos.length)}</div>`;
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
  if (title.startsWith('/')) {
    return `<span class="command-text">${escapeHtml(title)}</span>`;
  }
  return applyCommonFormatting(escapeHtml(title), false);
}

function renderSessionsList(sessions, selectedSessionId = null) {
  const groups = groupSessionsByTime(sessions);
  let html = '';

  for (const [groupName, groupSessions] of Object.entries(groups)) {
    if (groupSessions.length === 0) continue;

    html += `<div class="group-header">${formatGroupHeader(groupName, groupSessions.length)}</div>`;
    html += groupSessions.map(session => {
      const percentage = session.tokenPercentage || 0;
      const isActive = session.id === selectedSessionId ? 'active' : '';

      let percentageClass = 'percentage-badge';
      if (percentage > 80) {
        percentageClass += ' danger';
      } else if (percentage > 50) {
        percentageClass += ' warning';
      }

      return `
        <div class="list-item ${isActive}" onclick="window.selectSession('${state.selectedRepo}', '${session.id}')">
          <div class="item-name">${formatTitle(session.title)}</div>
          <div class="session-footer">
            <span class="${percentageClass}">${percentage}%</span>
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
      document.getElementById('sidebarHeader').innerHTML = '<span class="sidebar-title">Repositories (0)</span>';
      document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">No repositories found</div>';
      return;
    }

    document.getElementById('sidebarHeader').innerHTML = `<span class="sidebar-title">Repositories (${data.repos.length})</span>`;
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
      document.getElementById('sidebarHeader').innerHTML = `
        <span class="back-button" onclick="window.navigateTo('/repositories')">← Back</span>
        <span class="sidebar-title">${repoName} (0)</span>
      `;
      document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">No sessions found</div>';
      return;
    }

    document.getElementById('sidebarHeader').innerHTML = `
      <span class="back-button" onclick="window.navigateTo('/repositories')">← Back</span>
      <span class="sidebar-title">${repoName} (${data.sessions.length})</span>
    `;
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

    document.getElementById('sidebarHeader').innerHTML = `
      <span class="back-button" onclick="window.navigateTo('/repositories')">← Back</span>
      <span class="sidebar-title">${repoName} (${sessionsData.sessions.length})</span>
    `;

    document.getElementById('sidebarContent').innerHTML = renderSessionsList(sessionsData.sessions, sessionId);

    const res = await fetch(`/api/sessions/${encodeURIComponent(repoId)}/${sessionId}`);
    const data = await res.json();

    const imagesRes = await fetch(`/api/sessions/${encodeURIComponent(repoId)}/${sessionId}/images`);
    const imagesData = await imagesRes.json();
    sessionImages = imagesData.images || {};

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

    const url = new URL(window.location);
    const imageIndex = url.searchParams.get('imageIndex');
    if (imageIndex && sessionImages[imageIndex]) {
      setTimeout(() => window.showImage(parseInt(imageIndex)), 100);
    }
  } catch (error) {
    document.getElementById('contentBody').innerHTML = '<div class="empty-state">Error loading session</div>';
  }
}
