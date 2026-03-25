import type { PieSvgProps } from '@nivo/pie';
import moment, { type Moment } from 'moment';
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
import { CHART_COLORS } from '@/constants/recharts';

import CardSkeleton from './CardSkeleton';
import PieBlock from './Chart';
import DistributionList from './DistributionList';
import DonutTooltip from './DonutTooltip';
import type { DrawerListingTarget } from './TransactionsDrawer';
import type { Datum, ProcessedCategory } from './types';
import { processCategoryTree } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryApiNode = {
  id: number;
  name: string;
  total: number;
  children?: CategoryApiNode[];
};

type Props = {
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

// ─── Component ────────────────────────────────────────────────────────────────

const CategoriesPanel: React.FC<Props> = ({
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
    () => (currentCategory ? currentCategory.children : root),
    [currentCategory, root],
  );

  const scopeTotal = useMemo(() => {
    const raw = currentCategory ? currentCategory.value : totalRoot;
    return showMonthlyAverage ? calcMonthlyAverage(raw) : raw;
  }, [currentCategory, totalRoot, showMonthlyAverage, calcMonthlyAverage]);

  const chartData = useMemo(
    () =>
      currentCategories.map((c) => ({
        id: c.id,
        label: c.name,
        value: showMonthlyAverage ? calcMonthlyAverage(c.value) : c.value,
      })),
    [currentCategories, showMonthlyAverage, calcMonthlyAverage],
  );

  // Pie data — same shape as Datum
  const pieData = useMemo<Datum[]>(
    () => chartData.map((c) => ({ id: String(c.id), label: c.label, value: c.value })),
    [chartData],
  );

  // Color map: assign CHART_COLORS by index in sorted order
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    pieData.forEach((d, i) => {
      map.set(String(d.id), CHART_COLORS[i % CHART_COLORS.length]);
    });
    return map;
  }, [pieData]);

  const pieColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => colorMap.get(String((d as { id: string | number }).id)) ?? CHART_COLORS[0],
    [colorMap],
  );

  const categoriesById = useMemo(() => new Map(currentCategories.map((c) => [String(c.id), c])), [currentCategories]);

  const breadcrumbs = useMemo(
    () =>
      [{ id: 0, name: 'All' }, ...categoryStack.slice(1), currentCategory].filter(Boolean) as Array<{
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
        setCategoryStack((prev) => [
          ...prev,
          currentCategory || {
            id: 0,
            name: 'Root',
            value: totalRoot,
            children: root,
          },
        ]);
        setCurrentCategory(category);
      }
    },
    [currentCategory, totalRoot, root, setCategoryStack, setCurrentCategory],
  );

  const tooltip = useCallback(
    ({ datum }: { datum: { data: Datum; value: number } }) => {
      const percent = scopeTotal > 0 ? (datum.value / scopeTotal) * 100 : 0;
      return <DonutTooltip label={String(datum.data.label)} percent={percent} value={datum.value} />;
    },
    [scopeTotal],
  );

  const listItems = useMemo(
    () =>
      chartData.map((r) => ({
        id: String(r.id),
        name: r.label,
        value: r.value,
        hasChildren: (categoriesById.get(String(r.id))?.children.length ?? 0) > 0,
      })),
    [chartData, categoriesById],
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

  const hasData = currentCategories.length > 0;

  const donutContent = hasData ? (
    <>
      <PieBlock
        animate
        colors={pieColors}
        data={pieData}
        tooltip={tooltip}
        onClick={(node) => {
          const cat = categoriesById.get(String(node.data.id));
          if (cat) handleCategoryStep(cat);
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center max-w-[88px]">
          <MoneyValue
            amount={scopeTotal}
            useColors={false}
            className="text-sm font-bold font-mono tabular-nums leading-none"
          />
        </div>
      </div>
    </>
  ) : (
    <div className="flex items-center justify-center h-full">
      <span className="text-2xs text-muted-foreground">No data</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Pie donut chart */}
      <div className="shrink-0 h-[180px] relative">{donutContent}</div>

      {/* Breadcrumb + list */}
      <div className="border-t shrink-0" />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {breadcrumbs.length > 1 && (
          <div className="shrink-0 px-2 pt-1 pb-0.5">
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap gap-x-1 gap-y-0">
                {breadcrumbs.map(({ id, name }, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  const crumbNode = isLast ? (
                    <BreadcrumbPage className="text-2xs">{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        aria-label={`Go to ${name}`}
                        role="button"
                        tabIndex={0}
                        className="text-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
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
                  );
                  return (
                    <React.Fragment key={id}>
                      {index > 0 && <BreadcrumbSeparator className="text-muted-foreground/40" />}
                      {crumbNode}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <DistributionList
            ariaLabel="Categories distribution list"
            getDotColor={(item) => colorMap.get(String(item.id)) ?? null}
            items={listItems}
            total={scopeTotal}
            onRowClick={(id) => {
              const category = categoriesById.get(id);
              if (category) handleCategoryStep(category);
            }}
            onViewTransactions={openCategoryTransactions}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoriesPanel;
