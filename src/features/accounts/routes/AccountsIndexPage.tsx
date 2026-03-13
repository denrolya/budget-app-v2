import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES } from '@/constants/currency';
import { ACCOUNT_TYPES_ORDER, Type as AccountType } from '@/features/accounts';
import { AccountPill } from '@/features/accounts/components/Pill';
import { useBaseCurrency } from '@/features/auth';
import { useActiveAccounts } from '@/hooks/financeData';

import AccountsAnalyticsPanel from '../components/analytics/AccountsAnalyticsPanel';
import type Account from '../models/Account';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash',
  internet: 'Online',
  basic: 'Other',
};

// ─── Component ────────────────────────────────────────────────────────────────

const AccountsIndexPage: React.FC = () => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();
  const navigate = useNavigate();
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({
    [AccountType.Bank]: true,
    [AccountType.Cash]: true,
    [AccountType.Internet]: true,
    [AccountType.Basic]: true,
  });

  const toggleType = useCallback((type: string) => {
    setOpenTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const { walletTotal, typeGroups, currencyGroups } = useMemo(() => {
    const typeMap = new Map<string, Account[]>();
    const currencyMap = new Map<string, Account[]>();

    for (const acc of accounts) {
      // Group by type
      const typeList = typeMap.get(acc.type) ?? [];
      typeList.push(acc);
      typeMap.set(acc.type, typeList);

      // Group by currency
      const currList = currencyMap.get(acc.currency) ?? [];
      currList.push(acc);
      currencyMap.set(acc.currency, currList);
    }

    const total = accounts.reduce((sum, acc) => sum + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);

    // By type (ordered by ACCOUNT_TYPES_ORDER)
    const typeGroups = ACCOUNT_TYPES_ORDER.map((type) => {
      const accs = typeMap.get(type) ?? [];
      if (!accs.length) return null;
      const typeTotal = accs.reduce((s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);
      // Sort accounts by converted value desc
      const sorted = [...accs].sort(
        (a, b) =>
          Math.abs(b.convertedValues?.[baseCurrency] ?? b.balance) -
          Math.abs(a.convertedValues?.[baseCurrency] ?? a.balance),
      );
      return { type, label: TYPE_LABELS[type] ?? type, accounts: sorted, total: typeTotal };
    }).filter(Boolean) as { type: string; label: string; accounts: Account[]; total: number }[];

    // By currency (for stats breakdown at bottom)
    const currencyGroups = Array.from(currencyMap.entries())
      .map(([currency, accs]) => {
        const currencyTotal = accs.reduce((s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);
        const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];
        const color =
          typeof window !== 'undefined'
            ? getComputedStyle(document.documentElement).getPropertyValue(`--account-bank-${currency}`).trim() || '#888'
            : '#888';
        return {
          currency,
          symbol: currencyInfo?.symbol ?? currency,
          color,
          total: currencyTotal,
          percentage: total > 0 ? (currencyTotal / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { walletTotal: total, typeGroups, currencyGroups };
  }, [accounts, baseCurrency]);

  const walletFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: baseCurrency,
    maximumFractionDigits: 0,
  }).format(walletTotal);

  return (
    <div className="flex h-full flex-col bg-muted overflow-hidden">
      <div className="flex-1 min-h-0 p-4 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
        <Card className="h-full overflow-hidden flex flex-col">
          {/* Stats strip */}
          <div className="flex-none border-b px-5 py-2.5 flex items-center gap-4 text-xs flex-wrap">
            <span className="font-semibold text-foreground tabular-nums">{walletFormatted}</span>
            <div aria-hidden className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{accounts.length}</span> account
              {accounts.length !== 1 ? 's' : ''}
            </span>
            <div aria-hidden className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{currencyGroups.length}</span> currenc
              {currencyGroups.length !== 1 ? 'ies' : 'y'}
            </span>
            {typeGroups[0] && (
              <>
                <div aria-hidden className="h-3.5 w-px bg-border" />
                <span className="text-muted-foreground">
                  {typeGroups[0].label}:{' '}
                  <span className="font-semibold text-foreground">
                    {walletTotal > 0 ? `${Math.round((typeGroups[0].total / walletTotal) * 100)}%` : '—'}
                  </span>
                </span>
              </>
            )}
          </div>

          {/* Chart + left panel */}
          <CardContent className="flex flex-1 min-h-0 min-w-0 overflow-hidden p-0">
            {/* Left panel — primary navigation by type */}
            <div className="w-56 lg:w-64 shrink-0 flex flex-col min-h-0 min-w-0 overflow-hidden border-r">
              <ScrollArea className="flex-1">
                <div className="pt-2 pb-3">
                  {typeGroups.map((group, groupIdx) => (
                    <div
                      style={{ animationDelay: `${100 + groupIdx * 60}ms` }}
                      className="animate-in fade-in slide-in-from-left-4 duration-300 ease-out [animation-fill-mode:both]"
                      key={group.type}
                    >
                      {/* Type group header */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-muted/50 transition-colors"
                        onClick={() => toggleType(group.type)}
                      >
                        <div className="flex items-center gap-1.5">
                          {openTypes[group.type] ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-foreground">{group.label}</span>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <span className="font-semibold text-foreground">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: baseCurrency,
                              maximumFractionDigits: 0,
                            }).format(group.total)}
                          </span>
                        </div>
                      </button>

                      {/* Account list */}
                      {openTypes[group.type] && (
                        <div className="pl-7 pr-2 space-y-0.5 pb-1">
                          {group.accounts.map((acc) => (
                            <button
                              type="button"
                              className="w-full flex items-center justify-between text-xs text-muted-foreground gap-2 hover:text-foreground hover:bg-muted rounded px-1.5 py-1 transition-colors cursor-pointer text-left"
                              key={acc.id}
                              onClick={() => navigate(`/accounts/${acc.id}`)}
                            >
                              <AccountPill account={acc} variant="inline" size="sm" tooltip={false} className="min-w-0 truncate" />
                              <MoneyValue
                                amount={acc.balance}
                                currency={acc.currency as any}
                                useColors={false}
                                values={{}}
                                className="text-xs tabular-nums shrink-0"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Currency breakdown at bottom */}
              {currencyGroups.length > 0 && (
                <div
                  style={{ animationDelay: '320ms' }}
                  className="flex-none border-t p-4 space-y-2 animate-in fade-in duration-300 ease-out [animation-fill-mode:both]"
                >
                  <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    By currency
                  </p>
                  {currencyGroups.map(({ currency, symbol, color, percentage }) => (
                    <div className="space-y-0.5" key={currency}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            aria-hidden
                            style={{ backgroundColor: color }}
                            className="inline-block h-1.5 w-1.5 rounded-full flex-none"
                          />
                          {symbol} {currency}
                        </span>
                        <span className="font-medium text-foreground tabular-nums">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                          className="h-full rounded-full transition-[width] duration-500 ease-out"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div aria-hidden className="flex-none w-px bg-border self-stretch my-3" />

            {/* Analytics dashboard */}
            <div className="min-h-0 min-w-0 flex-[1_1_0%] basis-0">
              <AccountsAnalyticsPanel onNavigate={(id) => navigate(`/accounts/${id}`)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsIndexPage;
