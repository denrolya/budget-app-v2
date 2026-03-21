import { ChevronRight } from 'lucide-react';
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { resolveHslOrMuted } from '@/lib/resolveCssVar';
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
        const color = resolveHslOrMuted(`--account-bank-${currency}`);
        return { currency, symbol, color, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
      })
      .sort((a, b) => b.amount - a.amount);

    return { open: openList, closed: closedList, currencyGroups: currencies };
  }, [debts, baseCurrency]);

  const [openGroupOpen, setOpenGroupOpen] = useState(true);
  const [closedGroupOpen, setClosedGroupOpen] = useState(false);

  const renderDebtList = (items: typeof debts) =>
    items.map((debt) => {
      const isActive = String(debt.id) === selectedId;
      const displayAmount = debt.convertedValues?.[baseCurrency] ?? debt.balance;
      const displayCurrency = (
        debt.convertedValues?.[baseCurrency] !== undefined ? baseCurrency : debt.currency
      ) as keyof typeof CURRENCIES;
      return (
        <button
          type="button"
          className={cn(
            'w-full flex items-center overflow-hidden text-xs gap-1.5 rounded px-1.5 py-1 transition-colors cursor-pointer text-left',
            {
              'bg-muted text-foreground font-medium': isActive,
              'text-muted-foreground hover:text-foreground hover:bg-muted': !isActive,
            },
          )}
          key={debt.id}
          onClick={() => navigate(`/debts/${debt.id}`)}
        >
          <span className="truncate min-w-0 flex-1">{debt.debtor}</span>
          <MoneyValue
            amount={displayAmount}
            currency={displayCurrency}
            showValuesTooltip={false}
            useColors={false}
            className="text-xs tabular-nums shrink-0"
          />
        </button>
      );
    });

  const renderGroup = (
    label: string,
    items: typeof debts,
    dotClass: string,
    expanded: boolean,
    onToggle: () => void,
  ) => (
    <div>
      <button
        type="button"
        className="w-full flex items-center gap-1.5 mb-0.5 py-0.5 text-left hover:text-foreground transition-colors"
        onClick={onToggle}
      >
        <ChevronRight
          className={cn('h-3 w-3 text-muted-foreground/60 shrink-0 transition-transform duration-200', {
            'rotate-90': expanded,
          })}
        />
        <span aria-hidden className={cn('h-2 w-2 rounded-sm flex-none', dotClass)} />
        <h2 className="text-xs font-semibold text-foreground">{label}</h2>
        <span className="text-2xs text-muted-foreground tabular-nums">{items.length}</span>
      </button>
      <div
        className={cn('grid transition-[grid-template-rows] duration-200 ease-in-out', {
          'grid-rows-[1fr]': expanded,
          'grid-rows-[0fr]': !expanded,
        })}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pl-[18px] pb-1">{renderDebtList(items)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-1 overflow-hidden">
          {open.length > 0 &&
            renderGroup('Open', open, 'bg-[hsl(var(--chart-1))]', openGroupOpen, () => setOpenGroupOpen((v) => !v))}
          {closed.length > 0 &&
            renderGroup('Closed', closed, 'bg-muted-foreground/40', closedGroupOpen, () =>
              setClosedGroupOpen((v) => !v),
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
                  style={{ transform: `scaleX(${percentage / 100})`, backgroundColor: color }}
                  className="h-full rounded-full origin-left transition-transform duration-500 ease-out"
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
