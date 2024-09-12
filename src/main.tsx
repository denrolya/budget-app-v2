import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import { AuthProvider } from '@/contexts/auth.tsx';
import Routing from '@/components/common/Routing';
import { Theme, ThemeProvider } from '@/contexts/theme';
import store from '@/store';
import '@/assets/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme={Theme.System}>
      <AuthProvider>
        <Provider store={store}>
          <Router>
            <Routing />
          </Router>
        </Provider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
