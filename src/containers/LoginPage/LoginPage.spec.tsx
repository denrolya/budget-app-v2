import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { LoginPage } from './LoginPage';

describe('Login Component', () => {
  const mockedNavigate = vi.fn();


  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset mocks before each test
    vi.mocked(mockedNavigate).mockReset();

    // Update the mocked useNavigate function to return the mock implementation
    vi.mocked(useNavigate).mockReturnValue(mockedNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle user input', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    expect(screen.getByLabelText(/username/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/password/i)).toHaveValue('password123');
  });

  it('should navigate on successful login', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(localStorage.getItem('token')).toBe('dummy-jwt-token');
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });

  it('should redirect if already authenticated', () => {
    localStorage.setItem('token', 'dummy-jwt-token');

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });
});
