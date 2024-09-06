import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

import Layout from './Layout';

vi.mock('@/components/AccountBalances/AccountBalances', () => ({
  default: () => <div>Account Balances Component</div>,
}));

vi.mock('@/components/shared/Navbar/Navbar', () => ({
  default: ({ toggleSidebar }: { toggleSidebar: () => void }) => (
    <div>
      <button onClick={toggleSidebar}>Toggle Sidebar</button>
    </div>
  ),
}));

vi.mock('@/components/shared/Sidebar/Sidebar', () => ({
  default: ({ sidebarOpen }: { sidebarOpen: boolean }) => (
    <div>{sidebarOpen ? 'Sidebar is open' : 'Sidebar is closed'}</div>
  ),
}));

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the Navbar, Sidebar, and AccountBalances components', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText('Account Balances Component')).toBeInTheDocument();
    expect(screen.getByText('Sidebar is closed')).toBeInTheDocument();
    expect(screen.getByText('Toggle Sidebar')).toBeInTheDocument();
  });

  it('should toggle the sidebar when the toggle button is clicked', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText('Sidebar is closed')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Toggle Sidebar'));

    expect(screen.getByText('Sidebar is open')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Toggle Sidebar'));

    expect(screen.getByText('Sidebar is closed')).toBeInTheDocument();
  });

  it('should render the Outlet component for nested routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<div>Child Route Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Child Route Content')).toBeInTheDocument();
  });
});
