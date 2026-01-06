import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import { logger } from '@/services/DebugLogger';
import { Theme, ThemeProvider } from '@/contexts/theme';
import { AuthProvider } from '@/contexts/auth';
import Routing from '@/components/common/Routing';

import '@/assets/styles/index.scss';

const queryClient = new QueryClient();

if (typeof window !== 'undefined') {
  window.logger = logger;
}
if (typeof global !== 'undefined') {
  global.logger = logger;
}

const PWAWrapper = ({ children }: { children: React.ReactNode }) => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setNewVersionAvailable(true);
              }
            });
          }
        });
      }).catch((error: Error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setNewVersionAvailable(false);
    window.location.reload();
  };

  return (
    <>
      {children}
      {newVersionAvailable && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-md shadow-lg">
          <p>New version available!</p>
          <button className="mt-2 bg-secondary text-secondary-foreground px-4 py-2 rounded" onClick={reloadPage}>
            Update and Reload
          </button>
        </div>
      )}
    </>
  );
};

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={Theme.System}>
        <AuthProvider>
          <Router>
            <PWAWrapper>
              <Routing />
            </PWAWrapper>
          </Router>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(<App />);
