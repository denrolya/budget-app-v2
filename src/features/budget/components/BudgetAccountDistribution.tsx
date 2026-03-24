import moment from 'moment';
import React, { useMemo } from 'react';

import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { CHART_COLORS } from '@/constants/recharts';
import { useBaseCurrency } from '@/features/auth';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import { Type as TransactionType } from '@/features/transactions';
import { useAccountDistribution, type AccountStat } from '@/hooks/statistics/useAccountDistributionStatistics';

import type { BudgetDTO } from '../api/types';
import { formatBudgetAmount } from '../utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash',
  internet: 'Online',
  basic: 'Other',
};

const MAX_ACCOUNTS = 8;

// ── Mini row (by type / by currency) ─────────────────────────────────────────

interface MiniRowProps {
  name: string;
  value: number;
  total: number;
  currency: string;
  color: string;
}

const MiniRow: React.FC<MiniRowProps> = ({ name, value, total, currency, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-xs text-muted-foreground truncate min-w-0 w-[72px] shrink-0">{name}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden min-w-0">
        <div
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
          className="h-full rounded-full transition-all duration-300"
        />
      </div>
      <span className="text-2xs tabular-nums text-muted-foreground/60 shrink-0 w-7 text-right">{pct.toFixed(0)}%</span>
      <span className="text-2xs tabular-nums font-mono font-medium shrink-0 w-16 text-right">
        {formatBudgetAmount(value, currency)}
      </span>
    </div>
  );
};

// ── Account row ───────────────────────────────────────────────────────────────

interface AccountRowProps {
  stat: AccountStat;
  total: number;
  baseCurrency: string;
}

const AccountRow: React.FC<AccountRowProps> = ({ stat, total, baseCurrency }) => {
  const pct = total > 0 ? (stat.value / total) * 100 : 0;
  const showConverted = stat.account.currency !== baseCurrency;
  return (
    <div className="flex items-center gap-2 py-0.5 min-w-0">
      <AccountMarker account={stat.account} size="sm" />
      <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{stat.account.name}</span>
      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden shrink-0">
        <div
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: stat.account.color }}
          className="h-full rounded-full transition-all duration-300"
        />
      </div>
      <span className="text-2xs tabular-nums text-muted-foreground/60 shrink-0 w-7 text-right">{pct.toFixed(0)}%</span>
      <span className="text-2xs tabular-nums font-mono font-medium shrink-0 text-right">
        {formatBudgetAmount(stat.amount, stat.account.currency)}
        {showConverted && (
          <span className="text-muted-foreground/40 ml-1">{formatBudgetAmount(stat.value, baseCurrency)}</span>
        )}
      </span>
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  budget: BudgetDTO;
}

const BudgetAccountDistribution: React.FC<Props> = ({ budget }) => {
  const baseCurrency = useBaseCurrency();

  const after = useMemo(() => moment(budget.startDate).startOf('day'), [budget.startDate]);
  const before = useMemo(() => moment(budget.endDate).endOf('day'), [budget.endDate]);

  const { stats, isLoading } = useAccountDistribution(
    { after, before, type: TransactionType.Expense, queryKey: 'budget-account-dist' },
    [budget.id],
  );

  const { byType, byCurrency, byAccount } = useMemo(() => {
    const typeMap = new Map<string, number>();
    const currencyMap = new Map<string, number>();

    for (const stat of stats) {
      const accountType = String(stat.account.type ?? '');
      typeMap.set(accountType, (typeMap.get(accountType) ?? 0) + stat.value);
      const accountCurrency = String(stat.account.currency ?? '');
      currencyMap.set(accountCurrency, (currencyMap.get(accountCurrency) ?? 0) + stat.value);
    }

    const sortedTypes = Array.from(typeMap.entries())
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    const sortedCurrencies = Array.from(currencyMap.entries())
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    return {
      byType: sortedTypes,
      byCurrency: sortedCurrencies,
      byAccount: stats.slice(0, MAX_ACCOUNTS),
    };
  }, [stats]);

  if (isLoading || stats.length === 0) return null;

  const typeTotal = byType.reduce((s, [, v]) => s + v, 0);
  const currencyTotal = byCurrency.reduce((s, [, v]) => s + v, 0);
  const accountTotal = byAccount.reduce((s, a) => s + a.value, 0);

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3">
      <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Expense channels</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-0 md:gap-y-0 md:divide-x divide-border/40">
        {/* By type */}
        <div className="md:pr-4">
          <div className="text-2xs text-muted-foreground/50 uppercase tracking-wider mb-1.5">By type</div>
          {byType.map(([type, value], i) => (
            <MiniRow
              color={CHART_COLORS[i % CHART_COLORS.length]}
              currency={baseCurrency}
              name={TYPE_LABELS[type] ?? type}
              total={typeTotal}
              value={value}
              key={type}
            />
          ))}
        </div>

        {/* By currency */}
        <div className="md:px-4">
          <div className="text-2xs text-muted-foreground/50 uppercase tracking-wider mb-1.5">By currency</div>
          {byCurrency.map(([code, value], i) => {
            const sym = CURRENCIES[code as CURRENCY_CODE]?.symbol;
            return (
              <MiniRow
                color={CHART_COLORS[i % CHART_COLORS.length]}
                currency={baseCurrency}
                name={sym ? `${sym} ${code}` : code}
                total={currencyTotal}
                value={value}
                key={code}
              />
            );
          })}
        </div>

        {/* By account */}
        <div className="md:pl-4">
          <div className="text-2xs text-muted-foreground/50 uppercase tracking-wider mb-1.5">By account</div>
          {byAccount.map((stat) => (
            <AccountRow baseCurrency={baseCurrency} stat={stat} total={accountTotal} key={stat.account.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetAccountDistribution;
