import { Layout } from '@/common/components/layout/Layout';

export function SettingsPage() {
  return (
    <Layout>
      <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">Settings</div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[600px]">
          <div className="mb-8">
            <h2 className="text-base mb-4 text-foreground">Settings</h2>
            <p className="text-muted-foreground leading-relaxed">
              Settings page placeholder. Configuration options will be available here.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
