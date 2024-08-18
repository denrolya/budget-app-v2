import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  const toggleSidebarMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the sidebar when sidebarOpen is true', () => {
    render(<Sidebar sidebarOpen={true} toggleSidebar={toggleSidebarMock} />);

    const sidebarElement = screen.getByRole('complementary'); // Use role for better targeting
    expect(sidebarElement).toHaveClass('block');
    expect(sidebarElement).not.toHaveClass('hidden');
  });

  it('should hide the sidebar when sidebarOpen is false', () => {
    render(<Sidebar sidebarOpen={false} toggleSidebar={toggleSidebarMock} />);

    const sidebarElement = screen.getByRole('complementary');
    expect(sidebarElement).toHaveClass('hidden');
  });

  it('should call toggleSidebar when the close button is clicked', () => {
    render(<Sidebar sidebarOpen={true} toggleSidebar={toggleSidebarMock} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(toggleSidebarMock).toHaveBeenCalledTimes(1);
  });

  it('should render navigation links correctly', () => {
    render(<Sidebar sidebarOpen={true} toggleSidebar={toggleSidebarMock} />);

    expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Transactions')).toHaveAttribute('href', '/transactions');
  });
});
