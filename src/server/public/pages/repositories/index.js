import { navigateTo, state } from '../../app.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

    document.getElementById('sidebarContent').innerHTML = data.repos.map(repo => {
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
  } catch (error) {
    document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">Error loading repos</div>';
  }
}

export function selectRepo(repoId) {
  navigateTo(`/repositories?repo=${encodeURIComponent(repoId)}`);
}

export async function renderSessions(repoId) {
  document.getElementById('mainSidebar').classList.remove('hidden');
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

    document.getElementById('sidebarContent').innerHTML = data.sessions.map(session => {
      const date = new Date(session.timestamp).toLocaleDateString();
      const tokenBadge = session.tokenPercentage ? `${session.tokenPercentage}%` : '';

      return `
        <div class="list-item" onclick="window.selectSession('${repoId}', '${session.id}')">
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
  } catch (error) {
    document.getElementById('sidebarContent').innerHTML = '<div class="empty-state">Error loading sessions</div>';
  }
}

export function selectSession(repoId, sessionId) {
  navigateTo(`/repositories?repo=${encodeURIComponent(repoId)}&sessionId=${sessionId}`);
}

export async function renderSession(repoId, sessionId) {
  document.getElementById('mainSidebar').classList.remove('hidden');
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

    document.getElementById('sidebarContent').innerHTML = sessionsData.sessions.map(session => {
      const date = new Date(session.timestamp).toLocaleDateString();
      const tokenBadge = session.tokenPercentage ? `${session.tokenPercentage}%` : '';
      const isActive = session.id === sessionId ? 'active' : '';

      return `
        <div class="list-item ${isActive}" onclick="window.selectSession('${repoId}', '${session.id}')">
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
            <div class="message-content">${escapeHtml(msg.content)}</div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('contentBody').scrollTop = document.getElementById('contentBody').scrollHeight;
  } catch (error) {
    document.getElementById('contentBody').innerHTML = '<div class="empty-state">Error loading session</div>';
  }
}
