import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import Routing from '@/components/common/Routing';
import { Theme, ThemeProvider } from '@/contexts/theme';
import { AuthProvider } from '@/features/auth';
import PWAWrapper from '@/PWAWrapper';
import { logger } from '@/services/DebugLogger';

import '@/assets/styles/index.scss';

const queryClient = new QueryClient();

declare global {
  interface Window {
    logger?: typeof logger;
  }
}

if (typeof window !== 'undefined') {
  window.logger = logger;
}

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
