import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type Category from '@/features/categories/models/Category';
import {
  useExpenseCategories,
  useExpenseCategoriesTree,
  useIncomeCategories,
  useIncomeCategoriesTree,
} from '@/hooks/financeData';
import { cn } from '@/lib/utils';

import { useMutations } from '../api';
import CategoryDialog from '../components/FormDialog';
import CategoryTree from '../components/TreeDND';
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

  return (
    <>
      <PageWithSidebar contentScrollable={false}>
        <PageWithSidebar.Sidebar>
          <div className={cn('flex h-full flex-col', isDeleting && 'pointer-events-none opacity-60')}>
            {/* Search */}
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search categories"
                  placeholder="Search..."
                  value={searchQuery}
                  className="h-10 pl-8"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                      categories={treeForType('expense')}
                      type="expense"
                      onAddNew={handleAddNew}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="income" className="m-0 flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <CategoryTree
                      categories={treeForType('income')}
                      type="income"
                      onAddNew={handleAddNew}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer action */}
            <div className="border-t border-border p-2">
              <Button
                size="sm"
                type="button"
                variant="secondary"
                className="h-10 w-full justify-center"
                onClick={() => handleAddNew(null, activeType)}
              >
                Add category
              </Button>
            </div>
          </div>
        </PageWithSidebar.Sidebar>

        <PageWithSidebar.Header title="Categories" />

        <PageWithSidebar.Content>
          <ScrollArea className="h-full">
            <div className="p-4 md:p-6">
              <div className="max-w-3xl space-y-4 text-muted-foreground">
                <p className="text-sm leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at arcu non leo pretium interdum.
                  Integer dignissim, massa sed tincidunt facilisis, odio sapien viverra turpis, in volutpat nisl risus
                  non nibh.
                </p>
                <p className="text-sm leading-relaxed">
                  Use the sidebar to search, drag &amp; drop categories, and manage the tree structure. Category
                  details will appear here later.
                </p>
              </div>
            </div>
          </ScrollArea>
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
