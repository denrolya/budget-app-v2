import { Search } from 'lucide-react';
import React from 'react';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const countCategories = (categories: Category[]): number => {
  let count = 0;

  const walk = (nodes: Category[]) => {
    nodes.forEach((node) => {
      count += 1;
      walk(node.children);
    });
  };

  walk(categories);
  return count;
};

const filterCategories = (categories: Category[], query: string): Category[] => {
  const q = query.trim().toLowerCase();
  if (!q) return categories;

  const filterNode = (cat: Category): Category | null => {
    const matchesSelf = cat.name.toLowerCase().includes(q);
    const children = cat.children
      .map(filterNode)
      .filter((c): c is Category => c !== null);

    if (matchesSelf || children.length > 0) {
      return { ...cat, children } as Category;
    }
    return null;
  };

  return categories.map(filterNode).filter((c): c is Category => c !== null);
};

const CategoriesPage = () => {
  const incomeCategoriesTree = useIncomeCategoriesTree();
  const expenseCategoriesTree = useExpenseCategoriesTree();
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();

  const [activeType, setActiveType] = React.useState<CategoryType>('expense');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [newCategoryParentId, setNewCategoryParentId] = React.useState<number | null>(null);
  const [newCategoryType, setNewCategoryType] = React.useState<CategoryType>('expense');

  const { delete: deleteCategory, isDeleting } = useMutations();

  const filteredIncome = React.useMemo(
    () => filterCategories(incomeCategoriesTree, searchQuery),
    [incomeCategoriesTree, searchQuery],
  );

  const filteredExpense = React.useMemo(
    () => filterCategories(expenseCategoriesTree, searchQuery),
    [expenseCategoriesTree, searchQuery],
  );

  const incomeCount = React.useMemo(() => countCategories(incomeCategoriesTree), [incomeCategoriesTree]);
  const expenseCount = React.useMemo(() => countCategories(expenseCategoriesTree), [expenseCategoriesTree]);

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

  const tree = activeType === 'income' ? filteredIncome : filteredExpense;
  const totalCount = activeType === 'income' ? incomeCount : expenseCount;

  return (
    <>
      <PageWithSidebar contentScrollable={false}>
        <PageWithSidebar.Sidebar>
          <div className={cn('flex h-full flex-col', isDeleting && 'pointer-events-none opacity-60')}>
            <div className="space-y-2 border-b border-border p-2">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search categories"
                  placeholder="Search..."
                  value={searchQuery}
                  className="h-9 pl-8"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant={activeType === 'expense' ? 'secondary' : 'ghost'}
                  className="h-8 justify-start"
                  onClick={() => setActiveType('expense')}
                >
                  <span aria-hidden="true" className="mr-2 size-2 rounded-full bg-destructive" />
                  Expense
                  <Badge variant="secondary" className="ml-auto px-2 py-0.5 text-2xs font-normal">
                    {expenseCount}
                  </Badge>
                </Button>

                <Button
                  size="sm"
                  variant={activeType === 'income' ? 'secondary' : 'ghost'}
                  className="h-8 justify-start"
                  onClick={() => setActiveType('income')}
                >
                  <span aria-hidden="true" className="mr-2 size-2 rounded-full bg-success" />
                  Income
                  <Badge variant="secondary" className="ml-auto px-2 py-0.5 text-2xs font-normal">
                    {incomeCount}
                  </Badge>
                </Button>
              </div>

              <div className="flex items-center justify-between px-1 pt-1">
                <div className="text-2xs font-medium text-muted-foreground">
                  {activeType === 'income' ? 'Income' : 'Expense'}
                  <span className="ml-2 text-muted-foreground/70">{totalCount}</span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-2xs hover:bg-accent"
                  onClick={() => handleAddNew(null, activeType)}
                >
                  Add
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                <CategoryTree
                  categories={tree}
                  type={activeType}
                  onAddNew={handleAddNew}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </div>
            </ScrollArea>
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
                  Use the sidebar to search, drag & drop categories, and manage the tree structure. Category details
                  will appear here later.
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
