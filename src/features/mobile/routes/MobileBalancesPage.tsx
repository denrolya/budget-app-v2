import groupBy from 'lodash/groupBy';
import { ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import { useBalanceHistory } from '@/features/accounts/api';
import type Account from '@/features/accounts/models/Account';
import { useBaseCurrency } from '@/features/auth';
import { CURRENCIES } from '@/constants/currency';
import { useActiveAccountsWithDefaultOrder, useArchivedAccounts, useDebts, useTotalBalance } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatMoney';

// ─── Sparkline ────────────────────────────────────────────────────────────────

const SPARKLINE_AFTER = moment().subtract(30, 'days').startOf('day');
const SPARKLINE_BEFORE = moment().endOf('day');

const AccountSparkline: React.FC<{ account: Account }> = ({ account }) => {
  const { data } = useBalanceHistory(account.id, SPARKLINE_AFTER, SPARKLINE_BEFORE, 'P1D');
  const points = data?.data ?? [];

  const path = useMemo(() => {
    if (points.length < 2) return null;
    const balances = points.map((p) => p.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const range = max - min || 1;
    const W = 48;
    const H = 18;
    return points
      .map((p, i) => {
        const x = ((i / (points.length - 1)) * W).toFixed(1);
        const y = (H - ((p.balance - min) / range) * H).toFixed(1);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points]);

  if (!path) return null;

  const color = `hsl(var(${account.balance >= 0 ? '--success' : '--destructive'}))`;

  return (
    <svg aria-hidden="true" height={18} width={48} className="shrink-0 opacity-50">
      <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </svg>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AccountRowProps {
  account: Account;
  dimmed?: boolean;
  onClick?: () => void;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, dimmed, onClick }) => {
  const baseCurrency = useBaseCurrency();
  const convertedValue = account.convertedValues?.[baseCurrency];
  const showConverted = convertedValue !== undefined && account.currency !== baseCurrency;

  return (
    <button
      disabled={dimmed}
      type="button"
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-3 border-b border-border/40 last:border-0 text-left',
        'hover:bg-muted/30 active:bg-muted/50 transition-colors',
        { 'opacity-50 pointer-events-none': dimmed },
      )}
      onClick={onClick}
    >
      <AccountMarker account={account} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{account.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{account.type}</p>
      </div>

      {!dimmed && <AccountSparkline account={account} />}

      <div className="text-right shrink-0">
        <p
          className={cn('font-mono text-sm tabular-nums', account.balance < 0 ? 'text-destructive' : 'text-foreground')}
        >
          {CURRENCIES[account.currency].symbol} {formatMoney(Math.abs(account.balance), account.currency)}
        </p>
        {showConverted && (
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            ≈ <MoneyValue amount={convertedValue} showValuesTooltip={false} useColors={false} />
          </p>
        )}
      </div>
    </button>
  );
};

const CurrencyGroup: React.FC<{ currency: string; accounts: Account[]; onAccountClick: (id: number) => void }> = ({
  currency,
  accounts,
  onAccountClick,
}) => (
  <div className="mb-2">
    <div className="px-3 py-1 flex items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{currency}</span>
      <span className="flex-1 h-px bg-border/50" />
    </div>
    {accounts.map((a) => (
      <AccountRow account={a} key={a.id} onClick={() => onAccountClick(a.id)} />
    ))}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const MobileBalancesPage: React.FC = () => {
  const baseCurrency = useBaseCurrency();
  const totalBalance = useTotalBalance();
  const activeAccounts = useActiveAccountsWithDefaultOrder();
  const archivedAccounts = useArchivedAccounts();
  const debts = useDebts();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);

  const totalDebt = useMemo(
    () => debts.reduce((sum, d) => sum + (d.convertedValues?.[baseCurrency] ?? 0), 0),
    [debts, baseCurrency],
  );

  const grouped = useMemo(
    () => Object.entries(groupBy(activeAccounts, 'currency')).sort(([a], [b]) => a.localeCompare(b)),
    [activeAccounts],
  );

  const handleAccountClick = (accountId: number) => {
    navigate('/m/ledger', { state: { accountId } });
  };

  return (
    <div className="pb-6">
      {/* Net worth hero */}
      <div className="px-4 py-5 border-b border-border">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1.5">net worth</p>
        <p className="font-mono text-3xl tabular-nums font-semibold leading-none">
          {CURRENCIES[baseCurrency].symbol}{' '}
          <MoneyValue amount={totalBalance} showSymbol={false} showValuesTooltip={false} useColors={false} />
        </p>

        {debts.length > 0 && (
          <p className="font-mono text-xs text-muted-foreground mt-2 tabular-nums">
            <span className="uppercase tracking-wider mr-1">debt</span>
            <span className="text-destructive">
              {CURRENCIES[baseCurrency].symbol} {formatMoney(totalDebt, baseCurrency)}
            </span>
          </p>
        )}
      </div>

      {/* Active accounts by currency */}
      <div className="mt-3">
        {grouped.map(([currency, accounts]) => (
          <CurrencyGroup accounts={accounts} currency={currency} key={currency} onAccountClick={handleAccountClick} />
        ))}
      </div>

      {/* Archived toggle */}
      {archivedAccounts.length > 0 && (
        <div className="px-3 mt-3">
          <button
            type="button"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {archivedAccounts.length} archived
          </button>

          {showArchived && archivedAccounts.map((a) => <AccountRow dimmed account={a} key={a.id} />)}
        </div>
      )}
    </div>
  );
};

export default MobileBalancesPage;
