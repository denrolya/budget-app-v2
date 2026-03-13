import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import Routing from '@/components/common/Routing';
import TopProgressBar from '@/components/common/TopProgressBar';
import { Toaster } from '@/components/ui/sonner';
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

// eslint-disable-next-line react-refresh/only-export-components
const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TopProgressBar />
      <ThemeProvider defaultTheme={Theme.System}>
        <AuthProvider>
          <Router>
            <PWAWrapper>
              <Routing />
            </PWAWrapper>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    <Toaster richColors />
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(<App />);
