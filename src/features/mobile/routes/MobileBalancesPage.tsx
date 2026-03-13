import groupBy from 'lodash/groupBy';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import type Account from '@/features/accounts/models/Account';
import { useBaseCurrency } from '@/features/auth';
import { CURRENCIES } from '@/constants/currency';
import { useActiveAccountsWithDefaultOrder, useArchivedAccounts, useDebts, useTotalBalance } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatMoney';

// ─── Sub-components ───────────────────────────────────────────────────────────

const AccountRow: React.FC<{ account: Account; dimmed?: boolean }> = ({ account, dimmed }) => {
  const baseCurrency = useBaseCurrency();
  const convertedValue = account.convertedValues?.[baseCurrency];
  const showConverted = convertedValue !== undefined && account.currency !== baseCurrency;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 border-b border-border/40 last:border-0',
        dimmed && 'opacity-50',
      )}
    >
      <AccountMarker account={account} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">{account.name}</p>
        <p className="font-mono text-2xs text-muted-foreground">{account.type}</p>
      </div>

      <div className="text-right shrink-0">
        <p
          className={cn('font-mono text-xs tabular-nums', account.balance < 0 ? 'text-destructive' : 'text-foreground')}
        >
          {CURRENCIES[account.currency].symbol} {formatMoney(Math.abs(account.balance), account.currency)}
        </p>
        {showConverted && (
          <p className="font-mono text-2xs text-muted-foreground tabular-nums">
            ≈ <MoneyValue amount={convertedValue} showValuesTooltip={false} useColors={false} />
          </p>
        )}
      </div>
    </div>
  );
};

const CurrencyGroup: React.FC<{ currency: string; accounts: Account[] }> = ({ currency, accounts }) => (
  <div className="mb-2">
    <div className="px-3 py-1 flex items-center gap-2">
      <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground">{currency}</span>
      <span className="flex-1 h-px bg-border/50" />
    </div>
    {accounts.map((a) => (
      <AccountRow account={a} key={a.id} />
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
  const [showArchived, setShowArchived] = useState(false);

  const totalDebt = useMemo(
    () => debts.reduce((sum, d) => sum + (d.convertedValues?.[baseCurrency] ?? 0), 0),
    [debts, baseCurrency],
  );

  const grouped = useMemo(
    () => Object.entries(groupBy(activeAccounts, 'currency')).sort(([a], [b]) => a.localeCompare(b)),
    [activeAccounts],
  );

  return (
    <div className="pb-6">
      {/* Net worth hero */}
      <div className="px-4 py-5 border-b border-border">
        <p className="font-mono text-2xs uppercase tracking-widest text-muted-foreground mb-1.5">net worth</p>
        <p className="font-mono text-3xl tabular-nums font-semibold leading-none">
          {CURRENCIES[baseCurrency].symbol}{' '}
          <MoneyValue amount={totalBalance} showSymbol={false} showValuesTooltip={false} useColors={false} />
        </p>

        {debts.length > 0 && (
          <p className="font-mono text-2xs text-muted-foreground mt-2 tabular-nums">
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
          <CurrencyGroup accounts={accounts} currency={currency} key={currency} />
        ))}
      </div>

      {/* Archived toggle */}
      {archivedAccounts.length > 0 && (
        <div className="px-3 mt-3">
          <button
            type="button"
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {archivedAccounts.length} archived
          </button>

          {showArchived && archivedAccounts.map((a) => <AccountRow dimmed account={a} key={a.id} />)}
        </div>
      )}
    </div>
  );
};

export default MobileBalancesPage;
