import { Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import MoneyValue from '@/components/common/MoneyValue';
import { DISTRIBUTION_PRESETS } from '@/constants/datetime';
import { processCategoryTree } from '@/features/statistics/components/DistributionDonut/utils';
import { Type as TransactionType } from '@/features/transactions';
import { useAccountDistribution, type AccountStat } from '@/hooks/statistics/useAccountDistributionStatistics';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { type UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { formatRange } from '@/lib/datetime/formatShortDate';
import { cn } from '@/lib/utils';
import { type Timeframe } from '@/types/global';

import AccountsCurrenciesPanel from './AccountCurrenciesPanel';
import CategoriesPanel from './CategoriesPanel';
import TransactionsDrawer, { type DrawerListingTarget } from './TransactionsDrawer';
import type { ProcessedCategory, TabKey } from './types';

const TABS: { value: TabKey; label: string }[] = [
  { value: 'accounts', label: 'Accs' },
  { value: 'currencies', label: 'FX' },
  { value: 'categories', label: 'Cats' },
];

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  controlledTimeframe?: UseTimeframeControl;
}

export const UnifiedDistributionCard = ({ controlledTimeframe, className }: Props) => {
  const [tab, setTab] = useState<TabKey>('accounts');
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [showMonthlyAverage, setShowMonthlyAverage] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<ProcessedCategory | null>(null);
  const [categoryStack, setCategoryStack] = useState<ProcessedCategory[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerListingTarget | null>(null);

  const openTransactions = useCallback((target: DrawerListingTarget) => {
    setDrawerTarget(target);
    setDrawerOpen(true);
  }, []);

  const fallback = useTimeframeControl({
    defaultTimeframe: { after: moment().startOf('month'), before: moment().endOf('month') },
    enablePreviousTimeframe: false,
    enablePeriod: false,
  });

  const timeframe = controlledTimeframe?.timeframe ?? fallback.timeframe;
  const setTimeframe = controlledTimeframe?.setTimeframe ?? fallback.setTimeframe;
  const isControlled = Boolean(controlledTimeframe?.timeframe?.after);

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: moment(range.after).startOf('day'),
        before: moment(range.before).endOf('day'),
      });
    },
    [setTimeframe],
  );

  const handleTypeChange = useCallback((next: TransactionType) => {
    setType(next);
    setCurrentCategory(null);
    setCategoryStack([]);
    setSelectedCurrency(null);
  }, []);

  const onTabChange = useCallback((next: TabKey) => {
    setTab(next);
    setSelectedCurrency(null);
    if (next !== 'categories') {
      setCurrentCategory(null);
      setCategoryStack([]);
    }
  }, []);

  const onCurrencySelect = useCallback((id: string) => {
    setSelectedCurrency((prev) => (prev === id ? null : id));
  }, []);

  const {
    stats: accountStats,
    total: totalAccountsRaw,
    isLoading: isLoadingAccounts,
  } = useAccountDistribution({ type, after: timeframe.after, before: timeframe.before }, []);

  const { data: categoryRaw, isLoading: isLoadingCategories } = useCategoryTreeStatistics({
    type,
    after: timeframe.after,
    before: timeframe.before,
  });

  const isLoading = tab === 'categories' ? isLoadingCategories : isLoadingAccounts;

  const isMultiMonth = timeframe.before.diff(timeframe.after, 'months') > 0;

  const toolbarTotal = useMemo(() => {
    const now = moment();
    const months = moment(timeframe.before).isAfter(now)
      ? now.diff(moment(timeframe.after), 'months')
      : moment(timeframe.before).diff(moment(timeframe.after), 'months');

    const applyMonthly = (v: number) => (showMonthlyAverage && months > 0 ? v / months : v);

    if (tab === 'accounts') return applyMonthly(totalAccountsRaw ?? 0);

    if (tab === 'currencies') {
      if (!selectedCurrency) {
        const sum = (accountStats ?? []).reduce((acc: number, s: AccountStat) => acc + (s?.value ?? 0), 0);
        return applyMonthly(sum);
      }
      const sum = (accountStats ?? []).reduce((acc: number, s: AccountStat) => {
        const code = s?.account?.currency ?? '—';
        return code !== selectedCurrency ? acc : acc + (s?.value ?? 0);
      }, 0);
      return applyMonthly(sum);
    }

    const root = processCategoryTree((categoryRaw ?? []) as unknown as Parameters<typeof processCategoryTree>[0]);
    const totalRoot = root.reduce((sum, c) => sum + c.value, 0);
    return applyMonthly(currentCategory ? currentCategory.value : totalRoot);
  }, [
    tab,
    totalAccountsRaw,
    accountStats,
    selectedCurrency,
    showMonthlyAverage,
    timeframe.after,
    timeframe.before,
    categoryRaw,
    currentCategory,
  ]);

  const panelKey = `${tab}-${type}`;

  const panelContent =
    tab === 'categories' ? (
      <CategoriesPanel
        categoryRaw={(categoryRaw ?? []) as unknown as Parameters<typeof CategoriesPanel>[0]['categoryRaw']}
        categoryStack={categoryStack}
        currentCategory={currentCategory}
        isLoading={isLoading}
        setCategoryStack={setCategoryStack}
        setCurrentCategory={setCurrentCategory}
        showMonthlyAverage={showMonthlyAverage}
        timeframe={timeframe}
        onOpenTransactions={openTransactions}
      />
    ) : (
      <AccountsCurrenciesPanel
        accountStats={accountStats ?? []}
        isLoading={isLoading}
        selectedCurrency={selectedCurrency}
        showMonthlyAverage={showMonthlyAverage}
        tab={tab}
        timeframe={timeframe}
        totalAccountsRaw={totalAccountsRaw ?? 0}
        onCurrencySelect={onCurrencySelect}
        onOpenTransactions={openTransactions}
      />
    );

  return (
    <>
      <div className={cn('flex flex-col h-full w-full border rounded-lg overflow-hidden bg-card', className)}>
        {/* Single dense toolbar */}
        <div className="shrink-0 flex items-center gap-1 px-2 border-b h-8 bg-card">
          {/* Tab segmented control */}
          <div className="flex items-center gap-0.5 bg-muted rounded p-0.5">
            {TABS.map((t) => (
              <button
                aria-pressed={tab === t.value}
                type="button"
                className={cn(
                  'h-5 px-1.5 text-2xs font-medium rounded-sm transition-colors',
                  tab === t.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={t.value}
                onClick={() => onTabChange(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Transaction type */}
          <button
            aria-label="Expenses"
            aria-pressed={type === TransactionType.Expense}
            type="button"
            className={cn(
              'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
              type === TransactionType.Expense
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleTypeChange(TransactionType.Expense)}
          >
            Exp
          </button>
          <button
            aria-label="Income"
            aria-pressed={type === TransactionType.Income}
            type="button"
            className={cn(
              'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
              type === TransactionType.Income
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleTypeChange(TransactionType.Income)}
          >
            Inc
          </button>

          {/* Monthly average toggle */}
          {isMultiMonth && (
            <>
              <div className="h-4 w-px bg-border mx-0.5" />
              <button
                aria-label="Show monthly average"
                aria-pressed={showMonthlyAverage}
                type="button"
                className={cn(
                  'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
                  showMonthlyAverage
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setShowMonthlyAverage(!showMonthlyAverage)}
              >
                /mo
              </button>
            </>
          )}

          {/* Currency back breadcrumb */}
          {tab === 'currencies' && selectedCurrency && (
            <>
              <div className="h-4 w-px bg-border mx-0.5" />
              <button
                aria-label={`Back from ${selectedCurrency ?? ''}`}
                type="button"
                className="h-5 px-1.5 text-2xs font-medium rounded-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSelectedCurrency(null)}
              >
                ← {selectedCurrency}
              </button>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Date picker (uncontrolled only) */}
          {!isControlled && (
            <>
              <DaterangePickerWithPresets
                after={timeframe.after}
                before={timeframe.before}
                presets={DISTRIBUTION_PRESETS}
                onChange={handleTimeframeChange}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground rounded px-1.5 py-0.5 leading-none cursor-pointer transition-colors"
                >
                  <CalendarIcon className="h-2.5 w-2.5" />
                  {formatRange(timeframe)}
                </button>
              </DaterangePickerWithPresets>
              <div className="h-4 w-px bg-border mx-0.5" />
            </>
          )}

          {/* Pinned total */}
          <MoneyValue
            amount={toolbarTotal}
            useColors={false}
            className="text-2xs font-semibold font-mono tabular-nums text-foreground pr-0.5"
          />
          {showMonthlyAverage && <span className="text-2xs text-muted-foreground leading-none">/mo</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="chart-enter h-full" key={panelKey}>
            {panelContent}
          </div>
        </div>
      </div>

      <TransactionsDrawer open={drawerOpen} target={drawerTarget} timeframe={timeframe} onOpenChange={setDrawerOpen} />
    </>
  );
};

export default UnifiedDistributionCard;
