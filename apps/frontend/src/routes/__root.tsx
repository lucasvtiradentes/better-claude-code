import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <Link
              to="/"
              className="text-text-primary hover:text-text-accent transition-colors font-medium"
              activeProps={{
                className: 'text-text-accent'
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/repositories"
              className="text-text-primary hover:text-text-accent transition-colors font-medium"
              activeProps={{
                className: 'text-text-accent'
              }}
            >
              Repositories
            </Link>
            <Link
              to="/settings"
              className="text-text-primary hover:text-text-accent transition-colors font-medium"
              activeProps={{
                className: 'text-text-accent'
              }}
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
