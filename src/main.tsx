import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import Routing from '@/components/common/Routing';
import { AuthProvider } from '@/contexts/auth';
import { Theme, ThemeProvider } from '@/contexts/theme';
import store from '@/store';
import { logger } from '@/utils/DebugLogger';

import '@/assets/styles/index.css';

const queryClient = new QueryClient();


// Make logger globally available
if (typeof window !== 'undefined') {
  window.logger = logger;
}
if (typeof global !== 'undefined') {
  global.logger = logger;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={Theme.System}>
        <AuthProvider>
          <Provider store={store}>
            <Router>
              <Routing />
            </Router>
          </Provider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
