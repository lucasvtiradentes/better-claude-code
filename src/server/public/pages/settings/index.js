export function renderSettings() {
  document.getElementById('mainSidebar').classList.add('hidden');
  document.getElementById('contentHeader').textContent = 'Settings';
  document.getElementById('contentBody').innerHTML = `
    <div class="settings-content">
      <div class="settings-section">
        <h2>Settings</h2>
        <p>Settings page placeholder. Configuration options will be available here.</p>
      </div>
    </div>
  `;
}
