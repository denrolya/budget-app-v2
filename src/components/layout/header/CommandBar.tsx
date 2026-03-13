import React from 'react';
import { useHotkeys as useReactHotkeys } from 'react-hotkeys-hook';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import RateTickers from '@/components/layout/statusline/RateTickers';

// ── Config ────────────────────────────────────────────────────────────────────

const ALL_WINDOWS = [
  { num: 1, label: 'LEDGER', path: ROUTES.LEDGER.path },
  { num: 2, label: 'ACCTS',  path: ROUTES.ACCOUNT_LIST.path },
  { num: 3, label: 'DEBTS',  path: ROUTES.DEBT_LIST.path },
  { num: 4, label: 'BUDGET', path: ROUTES.BUDGET_PAGE.path },
  { num: 5, label: 'BKTS',   path: ROUTES.BUCKETS_PAGE.path },
  { num: 6, label: 'CATS',   path: ROUTES.CATEGORIES_PAGE.path },
  { num: 7, label: 'DASH',   path: ROUTES.DASHBOARD.path },
] as const;

// ── Window Tab ────────────────────────────────────────────────────────────────

const WindowTab: React.FC<{
  num: number;
  label: string;
  path: string;
  isActive: boolean;
}> = ({ num, label, path, isActive }) => (
  <Link
    to={path}
    className={cn(
      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono tracking-wide select-none',
      'border transition-all duration-100',
      isActive
        ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
        : 'text-muted-foreground border-border/30 hover:text-foreground hover:border-border/60 hover:bg-muted/40',
    )}
    aria-current={isActive ? 'page' : undefined}
  >
    <span className="text-muted-foreground/50 text-3xs mr-0.5">{num}:</span>
    {label}
    {isActive && <span className="text-primary/50 text-3xs ml-0.5">*</span>}
  </Link>
);

// ── Component ─────────────────────────────────────────────────────────────────

const CommandBar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Number key shortcuts 1–7
  ALL_WINDOWS.forEach(({ num, path }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useReactHotkeys(
      String(num),
      (e) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        navigate(path);
      },
      { preventDefault: false },
      [navigate, path],
    );
  });

  return (
    <header className="h-9 shrink-0 flex items-center border-b gap-1 px-2 bg-background overflow-hidden">
      {/* ── Wordmark ── */}
      <Link
        to="/"
        className="flex-none font-mono text-xs font-bold tracking-widest text-foreground mr-1 px-1.5 py-0.5 rounded border border-border/40 hover:border-border/70 transition-colors select-none"
        title="Budget"
      >
        B
      </Link>

      {/* ── Window tabs ── */}
      <nav className="flex items-center gap-0.5" aria-label="Main navigation">
        {ALL_WINDOWS.map(({ num, label, path }) => (
          <WindowTab
            key={path}
            num={num}
            label={label}
            path={path}
            isActive={pathname.startsWith(path)}
          />
        ))}
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1 min-w-0" />

      {/* ── Exchange rates ── */}
      <div className="hidden md:flex items-center border-l border-border/40 pl-2">
        <RateTickers />
      </div>
    </header>
  );
};

export default React.memo(CommandBar);
