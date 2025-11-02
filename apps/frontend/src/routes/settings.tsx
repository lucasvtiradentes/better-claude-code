import { createFileRoute } from '@tanstack/react-router';
import { Layout } from '../components/layout/Layout';

export const Route = createFileRoute('/settings')({
  component: SettingsComponent
});

function SettingsComponent() {
  return (
    <Layout>
      <div className="p-4 border-b border-[#3e3e42] font-semibold text-sm flex items-center justify-between">
        Settings
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[600px]">
          <div className="mb-8">
            <h2 className="text-base mb-4 text-[#cccccc]">Settings</h2>
            <p className="text-[#858585] leading-relaxed">
              Settings page placeholder. Configuration options will be available here.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
