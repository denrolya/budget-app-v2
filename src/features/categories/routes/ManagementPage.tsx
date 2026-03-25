import { FoldVertical, Plus, Search, UnfoldVertical } from 'lucide-react';
import moment from 'moment';
import React, { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router-dom';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormType, useForm } from '@/contexts/Form';
import type Category from '@/features/categories/models/Category';
import { Type as TransactionType } from '@/features/transactions';
import { useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/hooks/financeData';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import CategoryTree, { type CategoryTreeRef } from '../components/TreeDND';
import { CategoryType } from '../types';

const CategoriesIndexPage = lazy(() => import('./CategoriesIndexPage'));
const CategoryDetailPage = lazy(() => import('./CategoryDetailPage'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const filterCategories = (categories: Category[], query: string): Category[] => {
  const q = query.trim().toLowerCase();
  if (!q) return categories;

  const filterNode = (cat: Category): Category | null => {
    const matchesSelf = cat.name.toLowerCase().includes(q);
    const children = cat.children.map(filterNode).filter((c): c is Category => c !== null);

    if (matchesSelf || children.length > 0) return { ...cat, children } as Category;
    return null;
  };

  return categories.map(filterNode).filter((c): c is Category => c !== null);
};

const countTree = (categories: Category[]): number =>
  categories.reduce((sum, cat) => sum + 1 + countTree(cat.children), 0);

const buildTotalsMap = (categories: Category[]): Map<number, number> => {
  const map = new Map<number, number>();
  const walk = (cats: Category[]) => {
    for (const cat of cats) {
      if ((cat as unknown as { total: number }).total != null) {
        map.set(cat.id, (cat as unknown as { total: number }).total);
      }
      walk(cat.children);
    }
  };
  walk(categories);
  return map;
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  selectedId: string | null;
}

const CategoriesSidebar: React.FC<SidebarProps> = ({ selectedId }) => {
  const { openForm } = useForm();
  const navigate = useNavigate();
  const incomeCategoriesTree = useIncomeCategoriesTree();
  const expenseCategoriesTree = useExpenseCategoriesTree();

  const [activeType, setActiveType] = useState<CategoryType>(CategoryType.Expense);
  const [searchQuery, setSearchQuery] = useState('');

  const { delete: deleteCategory, isDeleting } = useMutations();

  const expenseTreeRef = useRef<CategoryTreeRef>(null);
  const incomeTreeRef = useRef<CategoryTreeRef>(null);

  const filteredIncome = useMemo(
    () => filterCategories(incomeCategoriesTree, searchQuery),
    [incomeCategoriesTree, searchQuery],
  );

  const filteredExpense = useMemo(
    () => filterCategories(expenseCategoriesTree, searchQuery),
    [expenseCategoriesTree, searchQuery],
  );

  const expenseCount = useMemo(() => countTree(expenseCategoriesTree), [expenseCategoriesTree]);
  const incomeCount = useMemo(() => countTree(incomeCategoriesTree), [incomeCategoriesTree]);

  // Fetch per-category totals for current month
  const timeframe = useMemo(() => ({ after: moment().startOf('month'), before: moment().endOf('month') }), []);
  const transactionType = activeType === CategoryType.Expense ? TransactionType.Expense : TransactionType.Income;
  const { data: statsTree } = useCategoryTreeStatistics({ ...timeframe, type: transactionType });
  const totalsMap = useMemo(() => buildTotalsMap(statsTree ?? []), [statsTree]);

  const handleEdit = (category: Category) => openForm(FormType.Category, category);
  const handleAddNew = (parent: number | null, type: CategoryType) => openForm(FormType.Category, { type, parent });

  const handleDelete = async (category: Category) => {
    const isConfirmed = await confirm({
      title: 'Confirm Deletion',
      description: `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!isConfirmed) return;
    await deleteCategory(category.id);
  };

  const handleSelect = (category: Category) => navigate(`/categories/${category.id}`);

  const treeForType = (type: CategoryType) => (type === 'income' ? filteredIncome : filteredExpense);
  const activeTreeRef = activeType === 'income' ? incomeTreeRef : expenseTreeRef;

  const renderTree = (type: CategoryType, ref: React.RefObject<CategoryTreeRef>) => {
    const categories = treeForType(type);
    const isSearching = searchQuery.trim().length > 0;

    if (isSearching && categories.length === 0) {
      return (
        <div className="px-3 py-6 text-center">
          <p className="text-2xs text-muted-foreground">No categories matching &ldquo;{searchQuery}&rdquo;</p>
          <Button size="sm" variant="ghost" className="mt-2 text-2xs h-6" onClick={() => handleAddNew(null, type)}>
            <Plus className="h-3 w-3 mr-1" />
            Create &ldquo;{searchQuery}&rdquo;
          </Button>
        </div>
      );
    }

    return (
      <div className="p-2">
        <CategoryTree
          defaultCollapsed
          categories={categories}
          selectedId={selectedId}
          totalsMap={totalsMap}
          type={type}
          onAddNew={handleAddNew}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onSelect={handleSelect}
          ref={ref}
        />
      </div>
    );
  };

  return (
    <div className={cn('flex h-full flex-col', { 'pointer-events-none opacity-60': isDeleting })}>
      <div className="border-b px-2 py-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search categories"
              placeholder="Search…"
              value={searchQuery}
              className="h-7 pl-7 text-xs"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div aria-label="Category actions" role="toolbar" className="flex items-center gap-0.5">
            <Button
              aria-label="Create new category"
              size="icon"
              type="button"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleAddNew(null, activeType)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              aria-label="Expand all categories"
              size="icon"
              type="button"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => activeTreeRef.current?.expandAll()}
            >
              <UnfoldVertical className="h-3.5 w-3.5" />
            </Button>
            <Button
              aria-label="Collapse all categories"
              size="icon"
              type="button"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => activeTreeRef.current?.collapseAll()}
            >
              <FoldVertical className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={activeType}
        className="flex flex-1 flex-col min-h-0"
        onValueChange={(v) => setActiveType(v as CategoryType)}
      >
        <TabsList aria-label="Category type" className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="expense">Expense ({expenseCount})</TabsTrigger>
          <TabsTrigger value="income">Income ({incomeCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="m-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">{renderTree(CategoryType.Expense, expenseTreeRef)}</ScrollArea>
        </TabsContent>

        <TabsContent value="income" className="m-0 flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">{renderTree(CategoryType.Income, incomeTreeRef)}</ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Page shell ──────────────────────────────────────────────────────────────

const CategoriesPage: React.FC = () => {
  const categoryMatch = useMatch('/categories/:categoryId');
  const selectedId = categoryMatch?.params?.categoryId ?? null;

  return (
    <PageWithSidebar collapsible resizable contentScrollable={false}>
      <PageWithSidebar.Sidebar ariaLabel="Categories sidebar">
        <CategoriesSidebar selectedId={selectedId} />
      </PageWithSidebar.Sidebar>

      {!selectedId && <PageWithSidebar.Header title="Categories" />}

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Suspense fallback={null}>
          <Routes>
            <Route index element={<CategoriesIndexPage />} />
            <Route element={<CategoryDetailPage />} path=":categoryId" />
            <Route element={<Navigate replace to="/categories" />} path="*" />
          </Routes>
        </Suspense>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default CategoriesPage;
