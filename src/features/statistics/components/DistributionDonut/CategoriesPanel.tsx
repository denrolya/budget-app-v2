import { ResponsivePie } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import moment, { Moment } from 'moment';
import React, { useCallback, useMemo } from 'react';

import { Type as TransactionType } from '@/features/transactions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import CardSkeleton from './CardSkeleton';
import DistributionList from './DistributionList';
import DonutTooltip from './DonutTooltip';
import type { DrawerListingTarget } from './TransactionsDrawer';
import type { ProcessedCategory } from './types';
import { processCategoryTree } from './utils';

type CategoryApiNode = {
  id: number;
  name: string;
  total: number;
  children?: CategoryApiNode[];
};

type CategoryRow = {
  id: string;
  name: string;
  value: number;
};

type Props = {
  type: TransactionType;
  timeframe: { after: Moment; before: Moment };
  showMonthlyAverage: boolean;

  currentCategory: ProcessedCategory | null;
  categoryStack: ProcessedCategory[];
  setCurrentCategory: React.Dispatch<React.SetStateAction<ProcessedCategory | null>>;
  setCategoryStack: React.Dispatch<React.SetStateAction<ProcessedCategory[]>>;

  isLoading: boolean;
  categoryRaw: CategoryApiNode[];

  onOpenTransactions: (target: DrawerListingTarget) => void;
};

const CategoriesPanel: React.FC<Props> = ({
                                            type,
                                            timeframe,
                                            showMonthlyAverage,
                                            currentCategory,
                                            categoryStack,
                                            setCurrentCategory,
                                            setCategoryStack,
                                            isLoading,
                                            categoryRaw,
                                            onOpenTransactions,
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

  const root = useMemo<ProcessedCategory[]>(() => processCategoryTree(categoryRaw), [categoryRaw]);
  const totalRoot = useMemo(() => root.reduce((sum, c) => sum + c.value, 0), [root]);

  const currentCategories = useMemo<ProcessedCategory[]>(
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

  const categoriesById = useMemo(() => new Map(currentCategories.map((c) => [String(c.id), c])), [currentCategories]);

  const breadcrumbs = useMemo(
    () =>
      [{ id: 0, name: 'All Categories' }, ...categoryStack.slice(1), currentCategory].filter(Boolean) as Array<{
        id: number;
        name: string;
      }>,
    [categoryStack, currentCategory],
  );

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
        setCategoryStack((prev) => [...prev, currentCategory || {
          id: 0,
          name: 'Root',
          value: totalRoot,
          children: root,
        }]);
        setCurrentCategory(category);
      }
    },
    [currentCategory, totalRoot, root, setCategoryStack, setCurrentCategory],
  );

  const categoryRows = useMemo<CategoryRow[]>(
    () => chartData.map((r) => ({ id: String(r.id), name: r.label, value: r.value })).reverse(),
    [chartData],
  );

  const openCategoryTransactions = useCallback(
    (id: string) => {
      const category = categoriesById.get(String(id));
      const title = category ? `Transactions in ${category.name}` : 'Transactions';
      onOpenTransactions({ title, initialFilters: { categories: [Number(id)], withNestedCategories: true } });
    },
    [categoriesById, onOpenTransactions],
  );

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <div className="mb-2">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            {breadcrumbs.map(({ id, name }, index) => (
              <React.Fragment key={id}>
                {index > 0 && <BreadcrumbSeparator />}
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      aria-label={`Go to ${name}`}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      onClick={() => handleBreadcrumbClick(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleBreadcrumbClick(index);
                        }
                      }}
                    >
                      {name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="w-full h-56 sm:h-64 md:h-72 shrink-0">
        <ResponsivePie
          animate
          activeOuterRadiusOffset={6}
          borderWidth={0}
          colors={{ scheme: type === TransactionType.Expense ? 'red_grey' : 'greens' }}
          cornerRadius={3}
          data={chartData}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          innerRadius={0.6}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          padAngle={0.7}
          tooltip={({ datum }) => {
            const percent = scopeTotal > 0 ? (datum.value / scopeTotal) * 100 : 0;
            return <DonutTooltip label={String(datum.data.label)} percent={percent} value={datum.value} />;
          }}
          onClick={(node) => {
            const category = categoriesById.get(String(node.data.id));
            if (category) handleCategoryStep(category);
          }}
        />
      </div>

      <DistributionList
        ariaLabel="Categories distribution list"
        items={categoryRows}
        total={scopeTotal}
        renderTooltip={({ item }) => (
          <>
            <code className="font-mono text-xs">#{item.id}</code>: <span>{item.name}</span>
          </>
        )}
        onRowClick={(id) => {
          const category = categoriesById.get(id);
          if (category) handleCategoryStep(category);
        }}
        onViewTransactions={openCategoryTransactions}
      />
    </div>
  );
};

export default CategoriesPanel;
