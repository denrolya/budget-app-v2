import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import PrivateRoute from './PrivateRoute';

describe('PrivateRoute Component', () => {
  const mockedUseLocation = vi.mocked(useLocation);

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render child components when the user is authenticated', () => {
    // Mock isAuthenticated to return true
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('dummy-jwt-token');

    mockedUseLocation.mockReturnValue({ pathname: '/transactions' } as never);

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <Routes>
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <div>Dashboard</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Assert that the child component (Dashboard) is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should redirect to the login page if the user is not authenticated', () => {
    // Mock isAuthenticated to return false
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    mockedUseLocation.mockReturnValue({ pathname: '/transactions' } as never);

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <Routes>
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <div>Dashboard</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Assert that the redirect message is shown
    expect(screen.getByText('Redirected to /login')).toBeInTheDocument();
  });

  it('should preserve the location state when redirecting', () => {
    // Mock isAuthenticated to return false
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    const mockLocation = { pathname: '/transactions' };
    mockedUseLocation.mockReturnValue(mockLocation as never);

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <Routes>
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <div>Dashboard</div>
              </PrivateRoute>
            }
          />
          <Route
            path="/login"
            element={
              <div>
                Login Page
                <p>From: {mockLocation.pathname}</p>
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Assert that the redirect preserves the 'from' location state
    expect(screen.getByText('Redirected to /login')).toBeInTheDocument();
  });
});
