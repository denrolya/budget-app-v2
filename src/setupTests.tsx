import '@testing-library/jest-dom';
import type * as ReactRouterDom from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({
      state: {},
    })),
    Navigate: ({ to }: { to: string }) => <div>Redirected to {to}</div>,
  };
});
