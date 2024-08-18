import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import Navbar from './Navbar';

describe('Navbar Component', () => {
  const toggleSidebarMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render all account names and balances correctly', () => {
    render(<Navbar toggleSidebar={toggleSidebarMock} />);

    // Check that all account names and balances are displayed
    expect(screen.getByText('Main:')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();

    expect(screen.getByText('Savings:')).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();

    expect(screen.getByText('Investment:')).toBeInTheDocument();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
  });

  it('should call toggleSidebar when the menu button is clicked', () => {
    render(<Navbar toggleSidebar={toggleSidebarMock} />);

    const menuButton = screen.getByRole('button', { name: /open sidebar/i });
    fireEvent.click(menuButton);

    expect(toggleSidebarMock).toHaveBeenCalledTimes(1);
  });

  it('should display account information on medium and larger screens', () => {
    render(<Navbar toggleSidebar={toggleSidebarMock} />);

    // The account information should be visible on larger screens (check that it doesn't have the hidden class)
    const accountContainer = screen.getByText('Main:').closest('div');
    expect(accountContainer).not.toHaveClass('hidden');
  });
});
