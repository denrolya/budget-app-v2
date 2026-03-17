import React, { lazy, Suspense, useMemo } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { cn } from '@/lib/utils';

import { useList as useDebtsQuery } from '../api';

const DebtsIndexPage = lazy(() => import('./DebtsIndexPage'));
const DebtDetailPage = lazy(() => import('./DebtDetailPage'));

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const DebtsSidebar: React.FC<{ selectedId: string | null }> = ({ selectedId }) => {
  const navigate = useNavigate();
  const baseCurrency = useBaseCurrency();
  const { data: debts = [] } = useDebtsQuery({ withClosed: true });

  const { open, closed, currencyGroups } = useMemo(() => {
    const openList = debts.filter((d) => !d.isClosed());
    const closedList = debts.filter((d) => d.isClosed());

    const currencyMap = new Map<string, number>();
    let total = 0;
    for (const d of debts) {
      const converted = Math.abs(d.convertedValues?.[baseCurrency] ?? 0);
      currencyMap.set(d.currency, (currencyMap.get(d.currency) ?? 0) + converted);
      total += converted;
    }

    const currencies = Array.from(currencyMap.entries())
      .map(([currency, amount]) => {
        const symbol = CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol ?? currency;
        const color =
          getComputedStyle(document.documentElement).getPropertyValue(`--account-bank-${currency}`).trim() || '#888';
        return { currency, symbol, color, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
      })
      .sort((a, b) => b.amount - a.amount);

    return { open: openList, closed: closedList, currencyGroups: currencies };
  }, [debts, baseCurrency]);

  const renderDebtList = (items: typeof debts) =>
    items.map((debt) => {
      const isActive = String(debt.id) === selectedId;
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
          key={debt.id}
          onClick={() => navigate(`/debts/${debt.id}`)}
        >
          <span className="truncate">{debt.debtor}</span>
          <MoneyValue
            amount={debt.balance}
            currency={debt.currency}
            showValuesTooltip={false}
            useColors={false}
            values={debt.convertedValues}
            className="text-xs tabular-nums shrink-0"
          />
        </button>
      );
    });

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 pb-3 space-y-4">
          {open.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm flex-none bg-[hsl(var(--chart-1))]" />
                <span className="text-xs font-semibold text-foreground">Open</span>
                <span className="text-2xs text-muted-foreground tabular-nums">{open.length}</span>
              </div>
              <div className="space-y-0.5 pl-[18px]">{renderDebtList(open)}</div>
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm flex-none bg-muted-foreground/40" />
                <span className="text-xs font-semibold text-foreground">Closed</span>
                <span className="text-2xs text-muted-foreground tabular-nums">{closed.length}</span>
              </div>
              <div className="space-y-0.5 pl-[18px]">{renderDebtList(closed)}</div>
            </div>
          )}

          {debts.length === 0 && <p className="text-sm text-muted-foreground">No debts recorded yet.</p>}
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
  const debtMatch = useMatch('/debts/:debtId');
  const selectedId = debtMatch?.params?.debtId ?? null;

  return (
    <PageWithSidebar collapsible resizable contentScrollable={false} sidebarWidth="w-64">
      <PageWithSidebar.Sidebar ariaLabel="Debts sidebar">
        <DebtsSidebar selectedId={selectedId} />
      </PageWithSidebar.Sidebar>

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Suspense fallback={null}>
          <Routes>
            <Route index element={<DebtsIndexPage />} />
            <Route element={<DebtDetailPage />} path=":debtId" />
            <Route element={<Navigate replace to="/debts" />} path="*" />
          </Routes>
        </Suspense>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default ManagementPage;
