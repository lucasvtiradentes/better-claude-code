import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { configs } from './configs';
import './index.css';
import { queryClient } from './lib/tanstack-query';
import { routeTree } from './routeTree.gen';

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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
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
