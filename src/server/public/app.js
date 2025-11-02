import { renderHome } from './pages/home/index.js';
import { renderRepositories, renderSessions, renderSession, selectRepo, selectSession } from './pages/repositories/index.js';
import { renderSettings } from './pages/settings/index.js';

export const state = {
  currentPage: 'home',
  selectedRepo: null,
  selectedSession: null,
  repos: []
};

export function navigateTo(path) {
  history.pushState(null, '', path);
  handleRoute();
}

async function handleRoute() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  if (path === '/' || path === '') {
    state.currentPage = 'home';
    document.querySelector('[data-page="home"]').classList.add('active');
    await renderHome();
  } else if (path === '/repositories') {
    state.currentPage = 'repositories';
    document.querySelector('[data-page="repositories"]').classList.add('active');

    const repo = params.get('repo');
    const sessionId = params.get('sessionId');

    if (sessionId && repo) {
      await renderSession(repo, sessionId);
    } else if (repo) {
      await renderSessions(repo);
    } else {
      await renderRepositories();
    }
  } else if (path === '/settings') {
    state.currentPage = 'settings';
    document.querySelector('[data-page="settings"]').classList.add('active');
    renderSettings();
  }
}

window.navigateTo = navigateTo;
window.selectRepo = selectRepo;
window.selectSession = selectSession;

window.addEventListener('popstate', handleRoute);
handleRoute();
