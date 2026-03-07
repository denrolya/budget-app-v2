import { Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processCategoryTree } from '@/features/statistics/components/DistributionDonut/utils';
import { Type as TransactionType } from '@/features/transactions';
import { useAccountDistribution } from '@/hooks/statistics/useAccountDistributionStatistics';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { formatShortDate } from '@/lib/datetime/formatShortDate';
import { Timeframe } from '@/types/global';

import AccountsCurrenciesPanel from './AccountCurrenciesPanel';
import CategoriesPanel from './CategoriesPanel';
import ConfigurationMenu from './ConfigurationMenu';
import TransactionsDrawer, { type DrawerListingTarget } from './TransactionsDrawer';
import type { ProcessedCategory, TabKey } from './types';

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
        after: range.after ? moment(range.after).startOf('day') : timeframe.after,
        before: range.before ? moment(range.before).endOf('day') : timeframe.before,
      });
    },
    [setTimeframe, timeframe.after, timeframe.before],
  );

  const onTabChange = useCallback((v: string) => {
    const next = v as TabKey;
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

  const footerTotal = useMemo(() => {
    const now = moment();
    const months = moment(timeframe.before).isAfter(now)
      ? now.diff(moment(timeframe.after), 'months')
      : moment(timeframe.before).diff(moment(timeframe.after), 'months');

    const applyMonthly = (v: number) => (showMonthlyAverage && months > 0 ? v / months : v);

    if (tab === 'accounts') return applyMonthly(totalAccountsRaw ?? 0);

    if (tab === 'currencies') {
      if (!selectedCurrency) {
        const sum = (accountStats ?? []).reduce((acc: number, s: any) => acc + (s?.value ?? 0), 0);
        return applyMonthly(sum);
      }

      const sum = (accountStats ?? []).reduce((acc: number, s: any) => {
        const code = s?.account?.currency ?? '—';
        if (code !== selectedCurrency) return acc;
        return acc + (s?.value ?? 0);
      }, 0);

      return applyMonthly(sum);
    }

    const root = processCategoryTree((categoryRaw ?? []) as unknown as Parameters<typeof processCategoryTree>[0]);
    const totalRoot = root.reduce((sum, c) => sum + c.value, 0);
    const raw = currentCategory ? currentCategory.value : totalRoot;
    return applyMonthly(raw);
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

  return (
    <>
      <Card
        className={`flex flex-col h-full w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 ${className ?? ''}`}
      >
        <CardHeader className="p-4 pb-0 space-y-0.2">
          <div className="flex justify-between items-start">
            <CardTitle className="tracking-tight text-lg font-bold mb-2">
              {type === TransactionType.Expense ? 'Expenses' : 'Income'}
            </CardTitle>

            <div className="flex items-center">
              <ConfigurationMenu
                setShowMonthlyAverage={setShowMonthlyAverage}
                setType={setType}
                showMonthlyAverage={showMonthlyAverage}
                timeframe={timeframe}
                type={type}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1 min-h-0">
          {!isControlled ? (
            <DaterangePickerWithPresets
              after={timeframe.after}
              before={timeframe.before}
              onChange={handleTimeframeChange}
            >
              <span className="cursor-pointer hover:underline inline-flex flex-row mb-2">
                <span className="text-xs flex items-center">
                  <CalendarIcon className="inline h-3 w-3 mr-1" />
                  {formatShortDate(timeframe.after)} - {formatShortDate(timeframe.before)}
                </span>
              </span>
            </DaterangePickerWithPresets>
          ) : null}

          <div className="flex items-center justify-between gap-3 mb-2">
            <Tabs value={tab} onValueChange={onTabChange}>
              <TabsList aria-label="Distribution scope" className="h-9">
                <TabsTrigger value="accounts" className="text-xs sm:text-sm">
                  Accounts
                </TabsTrigger>
                <TabsTrigger value="currencies" className="text-xs sm:text-sm">
                  Currencies
                </TabsTrigger>
                <TabsTrigger value="categories" className="text-xs sm:text-sm">
                  Categories
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tab === 'currencies' ? (
              <Button
                aria-label="Back to all currencies"
                disabled={!selectedCurrency}
                size="sm"
                variant="ghost"
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedCurrency(null)}
              >
                {selectedCurrency ? 'Back' : ' '}
              </Button>
            ) : null}
          </div>

          {tab !== 'categories' ? (
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
          ) : (
            <CategoriesPanel
              categoryRaw={(categoryRaw ?? []) as unknown as Parameters<typeof CategoriesPanel>[0]['categoryRaw']}
              categoryStack={categoryStack}
              currentCategory={currentCategory}
              isLoading={isLoading}
              setCategoryStack={setCategoryStack}
              setCurrentCategory={setCurrentCategory}
              showMonthlyAverage={showMonthlyAverage}
              timeframe={timeframe}
              type={type}
              onOpenTransactions={openTransactions}
            />
          )}
        </CardContent>

        <CardFooter className="p-4 border-t">
          <div className="w-full flex items-center justify-between min-h-[48px]">
            <span className="text-sm font-medium">Total</span>
            <MoneyValue amount={footerTotal} useColors={false} className="text-lg font-semibold" />
          </div>
        </CardFooter>
      </Card>

      <TransactionsDrawer open={drawerOpen} target={drawerTarget} timeframe={timeframe} onOpenChange={setDrawerOpen} />
    </>
  );
};

export default UnifiedDistributionCard;
