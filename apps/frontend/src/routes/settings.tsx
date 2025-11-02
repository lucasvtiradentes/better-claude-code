import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: SettingsComponent
});

function SettingsComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
      <div className="bg-surface rounded-lg border border-border p-6">
        <p className="text-text-secondary">Settings coming soon...</p>
      </div>
    </div>
  );
}
