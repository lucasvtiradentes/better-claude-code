export async function renderHome() {
  document.getElementById('mainSidebar').classList.add('hidden');
  document.getElementById('contentHeader').textContent = 'Dashboard';
  document.getElementById('contentBody').innerHTML = '<div class="loading">Loading...</div>';

  try {
    const res = await fetch('/api/repos');
    const data = await res.json();

    const totalFolders = data.repos.length;
    const totalSessions = data.repos.reduce((sum, repo) => sum + repo.sessionCount, 0);

    document.getElementById('contentBody').innerHTML = `
      <div class="home-cards">
        <div class="card">
          <div class="card-title">Folders</div>
          <div class="card-value">${totalFolders}</div>
        </div>
        <div class="card">
          <div class="card-title">Sessions</div>
          <div class="card-value">${totalSessions}</div>
        </div>
      </div>
    `;
  } catch (error) {
    document.getElementById('contentBody').innerHTML = '<div class="empty-state">Error loading data</div>';
  }
}
