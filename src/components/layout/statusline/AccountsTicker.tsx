import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import AccountDraftBadge from '@/features/accounts/components/AccountDraftBadge';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import { Type as AccountType } from '@/features/accounts/types';
import { useActiveAccountsWithDefaultOrder } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import type Account from '@/features/accounts/models/Account';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_ORDER = [AccountType.Bank, AccountType.Cash, AccountType.Internet, AccountType.Basic] as const;

const TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.Bank]: 'BANK',
  [AccountType.Cash]: 'CASH',
  [AccountType.Internet]: 'NET',
  [AccountType.Basic]: 'BASIC',
};

// ── Balance formatter ─────────────────────────────────────────────────────────

const formatBalance = (balance: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'BTC' || currency === 'ETH' ? 4 : 0,
    }).format(Math.abs(balance));
  } catch {
    return `${Math.abs(balance).toFixed(0)} ${currency}`;
  }
};

// ── Type label chip ───────────────────────────────────────────────────────────

const TypeLabel: React.FC<{ label: string; first: boolean }> = ({ label, first }) => (
  <span aria-hidden className={cn('inline-flex items-center self-stretch flex-none gap-1', first ? 'pr-1.5' : 'px-2')}>
    {!first && <span className="w-px h-4 bg-border/50 flex-none" />}
    <span className="font-mono text-3xs uppercase tracking-widest text-muted-foreground bg-muted/40 border border-border/40 rounded px-1 py-px select-none">
      {label}
    </span>
  </span>
);

// ── Single 2-line pill ────────────────────────────────────────────────────────

// Marker: w-3 (12px) + gap-1.5 (6px) = 18px → pl-[18px] to align balance with name
const TickerPill = React.memo(({ account }: { account: Account }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={cn(
        'inline-flex flex-col items-start justify-center px-1.5 py-0.5 rounded flex-none',
        'hover:bg-muted/60 transition-colors duration-100 cursor-pointer',
        'border border-transparent hover:border-border/40',
        'select-none whitespace-nowrap',
      )}
      onClick={() => navigate(`/accounts/${account.id}`)}
    >
      {/* Line 1: marker + name + draft badge */}
      <span className="inline-flex items-center gap-1.5 leading-tight">
        <AccountMarker account={account} />
        <span className="font-mono text-xs tracking-wide">{account.name}</span>
        <AccountDraftBadge account={account} />
      </span>
      {/* Line 2: balance — pl matches marker(12px) + gap(6px) = 18px */}
      <span
        className={cn(
          'font-mono text-3xs tabular-nums leading-tight pl-[18px]',
          account.balance < 0 ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {formatBalance(account.balance, account.currency)}
      </span>
    </button>
  );
});

// ── Ticker ────────────────────────────────────────────────────────────────────

const AccountsTicker: React.FC = () => {
  const accounts = useActiveAccountsWithDefaultOrder();

  const groups = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({ type, accounts: accounts.filter((a) => a.type === type) })).filter(
        (g) => g.accounts.length > 0,
      ),
    [accounts],
  );

  if (!accounts.length) {
    return <span className="font-mono text-2xs text-muted-foreground">No accounts</span>;
  }

  return (
    <div className="relative flex-1 min-w-0 overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Scrollable strip */}
      <div className="flex items-center overflow-x-auto scrollbar-hide h-full gap-0.5">
        {groups.map((g, i) => (
          <React.Fragment key={g.type}>
            <TypeLabel first={i === 0} label={TYPE_LABELS[g.type]} />
            {g.accounts.map((acc) => (
              <TickerPill account={acc} key={acc.id} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default React.memo(AccountsTicker);
