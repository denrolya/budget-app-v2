import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import Routing from '@/components/Routing/Routing.tsx';
import store from '@/store';
import '@/assets/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <Routing />
      </Router>
    </Provider>
  </StrictMode>,
);
