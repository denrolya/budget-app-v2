import '@testing-library/jest-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({
      state: {},
    })),
    Navigate: ({ to }: { to: string }) => <div>Redirected to {to}</div>,
  };
});
