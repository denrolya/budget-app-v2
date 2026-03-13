import { ResponsiveSunburst } from '@nivo/sunburst';
import sortBy from 'lodash/sortBy';
import moment, { type Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import { Type as TransactionType } from '@/features/transactions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import MoneyValue from '@/components/common/MoneyValue';

import CardSkeleton from './CardSkeleton';
import DistributionList from './DistributionList';
import type { DrawerListingTarget } from './TransactionsDrawer';
import type { ProcessedCategory } from './types';
import { processCategoryTree } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryApiNode = {
  id: number;
  name: string;
  total: number;
  children?: CategoryApiNode[];
};

type SunburstDatum = {
  id: string;
  name: string;
  value?: number;
  children?: SunburstDatum[];
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

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [hoveredArc, setHoveredArc] = useState<{ name: string; value: number } | null>(null);

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

  // Sorted descending list for the distribution rows
  const chartData = useMemo(() => {
    const list = currentCategories.map((c) => ({
      id: c.id,
      label: c.name,
      value: showMonthlyAverage ? calcMonthlyAverage(c.value) : c.value,
    }));
    return sortBy(list, 'value').reverse();
  }, [currentCategories, showMonthlyAverage, calcMonthlyAverage]);

  const categoriesById = useMemo(
    () => new Map(currentCategories.map((c) => [String(c.id), c])),
    [currentCategories],
  );

  // Sunburst data — always reflects the current drill level
  const sunburstData = useMemo((): SunburstDatum => {
    const toNode = (cat: ProcessedCategory): SunburstDatum => {
      if (cat.children && cat.children.length > 0) {
        return {
          id: String(cat.id),
          name: cat.name,
          children: cat.children.map(toNode),
        };
      }
      const value = showMonthlyAverage ? calcMonthlyAverage(cat.value) : cat.value;
      return { id: String(cat.id), name: cat.name, value };
    };

    return {
      id: 'root',
      name: currentCategory?.name ?? 'All',
      children: currentCategories.map(toNode),
    };
  }, [currentCategories, currentCategory, showMonthlyAverage, calcMonthlyAverage]);

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

  const listItems = useMemo(
    () =>
      chartData.map((r) => ({
        id: String(r.id),
        name: r.label,
        value: r.value,
        hasChildren: (categoriesById.get(String(r.id))?.children?.length ?? 0) > 0,
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

  const sunburstColors = useMemo(
    () => ({ scheme: type === TransactionType.Expense ? 'red_grey' : 'greens' } as Parameters<typeof ResponsiveSunburst>[0]['colors']),
    [type],
  );

  if (isLoading) return <CardSkeleton />;

  const hasSunburstData = currentCategories.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sunburst chart */}
      <div className="shrink-0 h-[180px] relative">
        {hasSunburstData ? (
          <>
            <ResponsiveSunburst<SunburstDatum>
              animate
              inheritColorFromParent
              borderColor={{ theme: 'background' } as Parameters<typeof ResponsiveSunburst>[0]['borderColor']}
              borderWidth={1}
              childColor={{ from: 'color', modifiers: [['brighter', 0.35]] } as Parameters<typeof ResponsiveSunburst>[0]['childColor']}
              colors={sunburstColors}
              cornerRadius={2}
              data={sunburstData}
              enableArcLabels={false}
              id="id"
              innerRadius={0.5}
              margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
              motionConfig="gentle"
              value="value"
              onClick={(node) => {
                const cat = currentCategories.find(
                  (c) => String(c.id) === String((node.data as SunburstDatum).id),
                );
                if (cat) handleCategoryStep(cat);
              }}
              onMouseEnter={(node) =>
                setHoveredArc({ name: (node.data as SunburstDatum).name, value: node.value })
              }
              onMouseLeave={() => setHoveredArc(null)}
            />
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-[88px]">
                {hoveredArc ? (
                  <>
                    <p className="text-[9px] text-muted-foreground leading-none mb-0.5 truncate">
                      {hoveredArc.name}
                    </p>
                    <MoneyValue
                      amount={hoveredArc.value}
                      useColors={false}
                      className="text-xs font-bold font-mono tabular-nums leading-none"
                    />
                  </>
                ) : (
                  <MoneyValue
                    amount={scopeTotal}
                    useColors={false}
                    className="text-sm font-bold font-mono tabular-nums leading-none"
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xs text-muted-foreground">No data</span>
          </div>
        )}
      </div>

      {/* Breadcrumb + list */}
      <div className="border-t shrink-0" />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {breadcrumbs.length > 1 && (
          <div className="shrink-0 px-2 pt-1 pb-0.5">
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap gap-x-1 gap-y-0">
                {breadcrumbs.map(({ id, name }, index) => (
                  <React.Fragment key={id}>
                    {index > 0 && <BreadcrumbSeparator className="text-muted-foreground/40" />}
                    {index === breadcrumbs.length - 1 ? (
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
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <DistributionList
            ariaLabel="Categories distribution list"
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
