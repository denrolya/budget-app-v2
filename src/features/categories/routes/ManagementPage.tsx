import { FoldVertical, Plus, Search, UnfoldVertical } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type Category from '@/features/categories/models/Category';
import CategoriesSunburst from '@/features/sandbox/components/Sunburst.example';
import { Type as TransactionType } from '@/features/transactions';
import {
  useExpenseCategories,
  useExpenseCategoriesTree,
  useIncomeCategories,
  useIncomeCategoriesTree,
} from '@/hooks/financeData';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import CategoryDialog from '../components/FormDialog';
import CategoryTree, { type CategoryTreeRef } from '../components/TreeDND';
import type { CategoryType } from '../types';

const countDescendants = (category: Category): number => {
  let count = 0;

  const walk = (node: Category) => {
    node.children.forEach((child) => {
      count += 1;
      walk(child);
    });
  };

  walk(category);
  return count;
};

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

const CategoriesPage = () => {
  const incomeCategoriesTree = useIncomeCategoriesTree();
  const expenseCategoriesTree = useExpenseCategoriesTree();
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();

  const [activeType, setActiveType] = useState<CategoryType>('expense');
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');

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

  const dialogCategories = newCategoryType === 'income' ? incomeCategories : expenseCategories;

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryParentId(null);
    setNewCategoryType(category.type);
    setDialogOpen(true);
  };

  const handleAddNew = (parentId: number | null, type: CategoryType) => {
    setEditingCategory(null);
    setNewCategoryParentId(parentId);
    setNewCategoryType(type);
    setDialogOpen(true);
  };

  const handleDelete = async (category: Category) => {
    const childCount = countDescendants(category);
    const message =
      childCount > 0
        ? `Delete "${category.name}" and its ${childCount} subcategories?`
        : `Delete "${category.name}"?`;

    if (!confirm(message)) return;

    await deleteCategory(category.id);
  };

  const treeForType = (type: CategoryType) => (type === 'income' ? filteredIncome : filteredExpense);

  const activeTreeRef = activeType === 'income' ? incomeTreeRef : expenseTreeRef;

  return (
    <>
      <PageWithSidebar contentScrollable={false}>
        <PageWithSidebar.Sidebar>
          <div className={cn('flex h-full flex-col', isDeleting && 'pointer-events-none opacity-60')}>
            {/* Search + compact toolbar */}
            <div className="border-b p-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search categories"
                    placeholder="Search…"
                    value={searchQuery}
                    className="h-9 pl-8"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div aria-label="Category actions" role="toolbar" className="flex items-center gap-1">
                  <Button
                    aria-label="Create new category"
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => handleAddNew(null, activeType)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Expand all categories"
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => activeTreeRef.current?.expandAll()}
                  >
                    <UnfoldVertical className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Collapse all categories"
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => activeTreeRef.current?.collapseAll()}
                  >
                    <FoldVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Type tabs */}
            <Tabs
              value={activeType}
              className="flex flex-1 flex-col min-h-0"
              onValueChange={(v) => setActiveType(v as CategoryType)}
            >
              <TabsList aria-label="Category type" className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>

              <TabsContent value="expense" className="m-0 flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <CategoryTree
                      defaultCollapsed
                      categories={treeForType('expense')}
                      type="expense"
                      onAddNew={handleAddNew}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      ref={expenseTreeRef}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="income" className="m-0 flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <CategoryTree
                      defaultCollapsed
                      categories={treeForType('income')}
                      type="income"
                      onAddNew={handleAddNew}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      ref={incomeTreeRef}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </PageWithSidebar.Sidebar>

        <PageWithSidebar.Header title="Categories" />

        <PageWithSidebar.Content>
          <CategoriesSunburst
            categories={activeType === TransactionType.Income ? incomeCategoriesTree : expenseCategoriesTree}
            height="100vh"
          />
        </PageWithSidebar.Content>
      </PageWithSidebar>

      <CategoryDialog
        allCategories={dialogCategories}
        category={editingCategory}
        open={dialogOpen}
        parentId={newCategoryParentId}
        type={newCategoryType}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default CategoriesPage;
