import { ResponsivePie } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import { CreditCard } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Type as TransactionType } from '@/features/transactions';

import { processCategoryTree } from './utils';
import CardSkeleton from './CardSkeleton';
import DonutTooltip from './DonutTooltip';
import type { ProcessedCategory } from './types';

const CategoriesPanel: React.FC<{
  type: TransactionType;
  timeframe: { after: Moment; before: Moment };
  showMonthlyAverage: boolean;

  currentCategory: ProcessedCategory | null;
  categoryStack: ProcessedCategory[];
  setCurrentCategory: React.Dispatch<React.SetStateAction<ProcessedCategory | null>>;
  setCategoryStack: React.Dispatch<React.SetStateAction<ProcessedCategory[]>>;

  setSelectedCategory: React.Dispatch<React.SetStateAction<ProcessedCategory | null>>;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;

  isLoading: boolean;
  categoryRaw: any[];
}> = ({
        type,
        timeframe,
        showMonthlyAverage,
        currentCategory,
        categoryStack,
        setCurrentCategory,
        setCategoryStack,
        setSelectedCategory,
        setIsDrawerOpen,
        isLoading,
        categoryRaw,
      }) => {
  const calcMonthlyAverage = useCallback(
    (value: number) => {
      const now = moment();
      const { after, before } = timeframe;
      const months = moment(before).isAfter(now)
        ? now.diff(moment(after), 'months')
        : moment(before).diff(moment(after), 'months');
      return months > 0 ? value / months : value;
    },
    [timeframe],
  );

  const root = useMemo(() => processCategoryTree(categoryRaw ?? []), [categoryRaw]);
  const totalRoot = useMemo(() => root.reduce((sum, c) => sum + c.value, 0), [root]);

  const currentCategories = useMemo(
    () => (currentCategory ? currentCategory.children || [] : root),
    [currentCategory, root],
  );

  const scopeTotal = useMemo(() => {
    const raw = currentCategory ? currentCategory.value : totalRoot;
    return showMonthlyAverage ? calcMonthlyAverage(raw) : raw;
  }, [currentCategory, totalRoot, showMonthlyAverage, calcMonthlyAverage]);

  const chartData = useMemo(() => {
    const list = currentCategories.map((c) => ({
      id: c.id,
      label: c.name,
      value: showMonthlyAverage ? calcMonthlyAverage(c.value) : c.value,
    }));
    return sortBy(list, 'value').reverse();
  }, [currentCategories, showMonthlyAverage, calcMonthlyAverage]);

  const breadcrumbs = useMemo(() => [{
    id: 0,
    name: 'All Categories',
  }, ...categoryStack.slice(1), currentCategory].filter(Boolean) as any[], [categoryStack, currentCategory]);

  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      if (index === 0) {
        setCurrentCategory(null);
        setCategoryStack([]);
        return;
      }

      const newStack = categoryStack.slice(0, index);
      const nextCurrent = newStack[newStack.length - 1] ?? null;
      setCurrentCategory(nextCurrent);
      setCategoryStack(newStack.slice(0, -1));
    },
    [categoryStack, setCurrentCategory, setCategoryStack],
  );

  const handleCategoryStep = useCallback(
    (category: ProcessedCategory) => {
      if (category.children && category.children.length > 0) {
        setCategoryStack((prev) => [
          ...prev,
          currentCategory || { id: 0, name: 'Root', value: totalRoot, children: root },
        ]);
        setCurrentCategory(category);
      }
    },
    [currentCategory, totalRoot, root, setCategoryStack, setCurrentCategory],
  );

  const openCategoryTransactions = useCallback(
    (category: ProcessedCategory) => {
      setSelectedCategory(category);
      setIsDrawerOpen(true);
    },
    [setSelectedCategory, setIsDrawerOpen],
  );

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <Breadcrumb>
        <BreadcrumbList className="flex-wrap">
          {breadcrumbs.map(({ id, name }, index) => (
            <React.Fragment key={id}>
              {index > 0 && <BreadcrumbSeparator />}
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{name}</BreadcrumbPage>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink className="cursor-pointer" onClick={() => handleBreadcrumbClick(index)}>
                    {name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="w-full h-56 sm:h-64 md:h-72 shrink-0">
        <ResponsivePie
          animate
          activeOuterRadiusOffset={6}
          borderWidth={0}
          colors={{ scheme: type === TransactionType.Expense ? 'red_grey' : 'greens' }}
          cornerRadius={3}
          data={chartData as any}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          innerRadius={0.6}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          padAngle={0.7}
          tooltip={({ datum: { data, value } }: any) => {
            const percent = scopeTotal > 0 ? (value / scopeTotal) * 100 : 0;
            return <DonutTooltip label={data.label} percent={percent} value={value} />;
          }}
          onClick={(node) => handleCategoryStep(node.data as any)}
        />
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea aria-label="Categories distribution list" className="h-full min-h-0">
          <div className="space-y-0.5 min-w-0">
            {chartData.map((row: any) => {
              const full = currentCategories.find((c) => c.id === row.id);
              const pct = scopeTotal > 0 ? (row.value / scopeTotal) * 100 : 0;

              return (
                <div
                  aria-label={`Open category ${row.label}`}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between gap-3 px-2 py-1 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                  key={row.id}
                  onClick={() => full && handleCategoryStep(full)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && full) {
                      e.preventDefault();
                      handleCategoryStep(full);
                    }
                  }}
                >
                  <ResponsiveTooltip
                    openDelay={120}
                    content={
                      <>
                        <code className="font-mono text-xs">#{row.id}</code>: <span>{row.label}</span>
                      </>
                    }
                    triggerClassName="truncate flex-1"
                  >
                    <span className="truncate text-sm leading-5 flex-1">
                      {row.label}
                      {row.value > 0 &&
                        <small className="ml-1 text-xs text-muted-foreground">({pct.toFixed(0)}%)</small>}
                    </span>
                  </ResponsiveTooltip>

                  <div className="flex items-center gap-2 shrink-0">
                    <MoneyValue amount={row.value} useColors={false} />

                    <ResponsiveTooltip
                      openDelay={120}
                      content="View transactions for this category within selected timeframe"
                      triggerClassName="m-0 p-0"
                    >
                      <Button
                        aria-label="View transactions"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!full) return;
                          openCategoryTransactions(full);
                        }}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="sr-only">View transactions</span>
                      </Button>
                    </ResponsiveTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CategoriesPanel;
