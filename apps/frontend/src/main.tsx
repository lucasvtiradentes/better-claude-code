import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { useSettingsSync } from './common/hooks/use-settings-sync';
import { queryClient } from './common/lib/tanstack-query';
import { configs } from './configs';
import { routeTree } from './routeTree.gen';
import './index.css';

const router = createRouter({
  routeTree,
  context: {
    queryClient
  }
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const AppContent = () => {
  useSettingsSync();
  return <RouterProvider router={router} />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-right" richColors />
      {configs.enableTanstackQueryDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

createRoot(rootElement).render(
  configs.enableStrictMode ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
);
