import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { useActiveAccounts } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

import AccountMarker from '../components/AccountMarker';
import { ACCOUNT_TYPES_ORDER } from '../constants';
import type Account from '../models/Account';
import { Type as AccountType } from '../types';

const AccountsIndexPage = lazy(() => import('./AccountsIndexPage'));
const AccountDetailPage = lazy(() => import('./AccountDetailPage'));

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash',
  internet: 'Online',
  basic: 'Other',
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const AccountsSidebar: React.FC<{ selectedId: string | null }> = ({ selectedId }) => {
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

  const { typeGroups, currencyGroups } = useMemo(() => {
    const typeMap = new Map<string, Account[]>();
    const currencyMap = new Map<string, Account[]>();

    for (const acc of accounts) {
      const typeList = typeMap.get(acc.type) ?? [];
      typeList.push(acc);
      typeMap.set(acc.type, typeList);

      const currList = currencyMap.get(acc.currency) ?? [];
      currList.push(acc);
      currencyMap.set(acc.currency, currList);
    }

    const walletTotal = accounts.reduce((s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);

    const types = ACCOUNT_TYPES_ORDER.map((type) => {
      const accs = typeMap.get(type) ?? [];
      if (!accs.length) return null;
      const typeTotal = accs.reduce((s, acc) => s + (acc.convertedValues?.[baseCurrency] ?? 0), 0);
      const sorted = [...accs].sort(
        (a, b) => (b.convertedValues?.[baseCurrency] ?? 0) - (a.convertedValues?.[baseCurrency] ?? 0),
      );
      return { type, label: TYPE_LABELS[type] ?? type, accounts: sorted, total: typeTotal };
    }).filter(Boolean) as { type: string; label: string; accounts: Account[]; total: number }[];

    const currencies = Array.from(currencyMap.entries())
      .map(([currency, accs]) => {
        const total = accs.reduce((s, acc) => s + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);
        const symbol = CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol ?? currency;
        const color =
          getComputedStyle(document.documentElement).getPropertyValue(`--account-bank-${currency}`).trim() || '#888';
        return {
          currency,
          symbol,
          color,
          total,
          percentage: walletTotal > 0 ? (total / walletTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { typeGroups: types, currencyGroups: currencies };
  }, [accounts, baseCurrency]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        <div className="pt-2 pb-3">
          {typeGroups.map((group) => (
            <div key={group.type}>
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
                <MoneyValue
                  amount={group.total}
                  showValuesTooltip={false}
                  useColors={false}
                  className="text-xs tabular-nums font-semibold shrink-0"
                />
              </button>

              {openTypes[group.type] && (
                <div className="pl-7 pr-2 space-y-0.5 pb-1">
                  {group.accounts.map((acc) => {
                    const isActive = String(acc.id) === selectedId;
                    return (
                      <button
                        type="button"
                        className={cn(
                          'w-full flex items-center justify-between text-xs gap-2 rounded px-1.5 py-1 transition-colors cursor-pointer text-left',
                          {
                            'bg-muted text-foreground font-medium': isActive,
                            'text-muted-foreground hover:text-foreground hover:bg-muted': !isActive,
                          },
                        )}
                        key={acc.id}
                        onClick={() => navigate(`/accounts/${acc.id}`)}
                      >
                        <span className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                          <AccountMarker account={acc} size="sm" />
                          <span className="truncate">{acc.name}</span>
                        </span>
                        <MoneyValue
                          amount={acc.convertedValues?.[baseCurrency] ?? acc.balance}
                          showValuesTooltip={false}
                          useColors={false}
                          className="text-xs tabular-nums shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {currencyGroups.length > 0 && (
        <div className="shrink-0 border-t p-4 space-y-2">
          <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">By currency</p>
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
  );
};

// ─── Page shell ───────────────────────────────────────────────────────────────

const ManagementPage: React.FC = () => {
  const accountMatch = useMatch('/accounts/:accountId');
  const selectedId = accountMatch?.params?.accountId ?? null;

  return (
    <PageWithSidebar collapsible resizable contentScrollable={false} sidebarWidth="w-72">
      <PageWithSidebar.Sidebar ariaLabel="Accounts sidebar">
        <AccountsSidebar selectedId={selectedId} />
      </PageWithSidebar.Sidebar>

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Suspense fallback={null}>
          <Routes>
            <Route index element={<AccountsIndexPage />} />
            <Route element={<AccountDetailPage />} path=":accountId" />
            <Route element={<Navigate replace to="/accounts" />} path="*" />
          </Routes>
        </Suspense>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default ManagementPage;
