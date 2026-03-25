import { Eye, Pencil, Trash2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';
import { useBaseCurrency } from '@/features/auth';
import { useList as useCategoryList, sortCategoryTree } from '@/features/categories';
import { CategoriesTimelineCard, TransactionsDrawer } from '@/features/statistics';
import type { DrawerListingTarget } from '@/features/statistics';
import DistributionList from '@/features/statistics/components/DistributionDonut/DistributionList';
import { Type as TransactionType } from '@/features/transactions';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVERAGE_LOOKBACK_MONTHS = 6;

interface StatsNode {
  id: number;
  name: string;
  total: number;
  children: StatsNode[];
}

const findStatsNode = (nodes: StatsNode[], targetId: number): StatsNode | null => {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    const found = findStatsNode(node.children, targetId);
    if (found) return found;
  }
  return null;
};

const castStatsTree = (tree: unknown[]): StatsNode[] => tree as StatsNode[];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiBlockProps {
  label: string;
  children: React.ReactNode;
}

const KpiBlock: React.FC<KpiBlockProps> = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-3xs font-mono uppercase tracking-widest text-muted-foreground/60 leading-none">{label}</span>
    <div className="text-sm font-mono tabular-nums font-semibold leading-tight">{children}</div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

const CategoryDetailPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { openForm } = useForm();
  const baseCurrency = useBaseCurrency();
  const { delete: deleteCategory } = useMutations();

  const { data: categoryData } = useCategoryList();
  const category = categoryData?.map.get(Number(categoryId));

  const transactionType = category?.type === 'income' ? TransactionType.Income : TransactionType.Expense;

  // Transactions drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerListingTarget | null>(null);

  // Current month stats
  const currentMonthTimeframe = useMemo(
    () => ({ after: moment().startOf('month'), before: moment().endOf('month') }),
    [],
  );
  const { data: currentStatsTree } = useCategoryTreeStatistics({ ...currentMonthTimeframe, type: transactionType });

  // 6-month lookback for monthly average
  const averageTimeframe = useMemo(
    () => ({
      after: moment().subtract(AVERAGE_LOOKBACK_MONTHS, 'months').startOf('month'),
      before: moment().endOf('month'),
    }),
    [],
  );
  const { data: averageStatsTree } = useCategoryTreeStatistics({
    ...averageTimeframe,
    type: transactionType,
    queryKey: 'category-tree-statistics-average',
  });

  const currentNode = useMemo(
    () => (currentStatsTree ? findStatsNode(castStatsTree(currentStatsTree), Number(categoryId)) : null),
    [currentStatsTree, categoryId],
  );

  const averageNode = useMemo(
    () => (averageStatsTree ? findStatsNode(castStatsTree(averageStatsTree), Number(categoryId)) : null),
    [averageStatsTree, categoryId],
  );

  const rootTotal = useMemo(
    () => castStatsTree(currentStatsTree ?? []).reduce((sum, node) => sum + (node.total ?? 0), 0),
    [currentStatsTree],
  );

  const categoryTotal = currentNode?.total ?? 0;
  const monthlyAverage = (averageNode?.total ?? 0) / AVERAGE_LOOKBACK_MONTHS;
  const percentOfTotal = rootTotal > 0 ? (categoryTotal / rootTotal) * 100 : 0;
  const subcategoryCount = category?.children.length ?? 0;

  const openTransactionsDrawer = useCallback((catId: number, catName: string) => {
    setDrawerTarget({
      title: catName,
      initialFilters: { categories: [catId], withNestedCategories: true },
      disabledFilters: ['categories'],
    });
    setDrawerOpen(true);
  }, []);

  // Subcategory distribution data (from current month stats)
  const subcategoryItems = useMemo(() => {
    if (!currentNode?.children || currentNode.children.length === 0) return [];
    return sortCategoryTree([...currentNode.children]).map((child) => ({
      id: String(child.id),
      name: child.name,
      value: child.total ?? 0,
      hasChildren: child.children.length > 0,
    }));
  }, [currentNode]);

  const subcategoryTotal = useMemo(
    () => subcategoryItems.reduce((sum, item) => sum + item.value, 0),
    [subcategoryItems],
  );

  if (!category) {
    return <Navigate replace to="/categories" />;
  }

  const breadcrumb = category.getFullPath();

  const handleEdit = () => openForm(FormType.Category, category);

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Confirm Deletion',
      description: `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!isConfirmed) return;
    await deleteCategory(category.id);
    navigate('/categories');
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <PageWithSidebar.Header title={category.name} className="px-4 py-2" onBack={() => navigate('/categories')}>
        {breadcrumb.length > 1 && (
          <span className="text-2xs text-muted-foreground font-mono truncate mr-auto">
            {breadcrumb.slice(0, -1).join(' › ')}
          </span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => openTransactionsDrawer(category.id, category.name)}
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View transactions</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleEdit}>
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit category</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete category</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* KPI strip */}
          <div className={cn('flex items-center gap-6 rounded-lg border bg-card px-4 py-3')}>
            <KpiBlock label="This month">
              <MoneyValue amount={categoryTotal} currency={baseCurrency} useColors={false} />
            </KpiBlock>
            <KpiBlock label="Monthly avg">
              <MoneyValue amount={monthlyAverage} currency={baseCurrency} useColors={false} />
            </KpiBlock>
            <KpiBlock label="% of total">
              <span className="font-mono tabular-nums">{percentOfTotal.toFixed(1)}%</span>
            </KpiBlock>
            {subcategoryCount > 0 && (
              <KpiBlock label="Subcategories">
                <span className="font-mono tabular-nums">{subcategoryCount}</span>
              </KpiBlock>
            )}
          </div>

          {/* Timeline chart */}
          <CategoriesTimelineCard />

          {/* Subcategory distribution */}
          {subcategoryItems.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="px-3 py-2 border-b">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subcategory distribution
                </span>
              </div>
              <div className="h-[200px]">
                <DistributionList
                  ariaLabel="Subcategory distribution"
                  items={subcategoryItems}
                  total={subcategoryTotal}
                  onRowClick={(id) => navigate(`/categories/${id}`)}
                  onViewTransactions={(id) => {
                    const child = subcategoryItems.find((c) => c.id === id);
                    openTransactionsDrawer(Number(id), child?.name ?? 'Transactions');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <TransactionsDrawer
        open={drawerOpen}
        target={drawerTarget}
        timeframe={currentMonthTimeframe}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default CategoryDetailPage;
