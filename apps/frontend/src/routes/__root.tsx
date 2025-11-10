import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { configs } from '@/configs';

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent
});

function RootComponent() {
  return (
    <>
      <Outlet />
      {configs.enableTanstackRouterDev && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
