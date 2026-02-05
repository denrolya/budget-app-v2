import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type Category from '@/features/categories/models/Category';
import {
  useExpenseCategories,
  useExpenseCategoriesTree,
  useIncomeCategories,
  useIncomeCategoriesTree,
} from '@/hooks/financeData';


import { useMutations } from '../api';
import CategoryDialog from '../components/FormDialog';
import CategoryTree from '../components/TreeDND';
import type { CategoryType } from '../types';

const countDescendants = (category: Category): number => {
  let count = 0;
  const traverse = (node: Category) => {
    for (const child of node.children) {
      count++;
      traverse(child);
    }
  };
  traverse(category);
  return count;
};

// Count all categories in a tree
const countCategories = (categories: Category[]): number => {
  let count = 0;
  const traverse = (nodes: Category[]) => {
    for (const node of nodes) {
      count++;
      traverse(node.children);
    }
  };
  traverse(categories);
  return count;
};

// Filter categories based on search query
const filterCategories = (categories: Category[], query: string): Category[] => {
  if (!query.trim()) return categories;

  const lowerQuery = query.toLowerCase();

  const filterNode = (cat: Category): Category | null => {
    const matchesSelf = cat.name.toLowerCase().includes(lowerQuery);
    const filteredChildren = cat.children
      .map((c) => filterNode(c))
      .filter((c): c is Category => c !== null);

    if (matchesSelf || filteredChildren.length > 0) {
      return { ...cat, children: filteredChildren } as Category;
    }
    return null;
  };

  return categories.map(filterNode).filter((c): c is Category => c !== null);
};


const CategoriesPage: React.FC = () => {
  // Data from hooks
  const incomeCategoriesTree = useIncomeCategoriesTree();
  const expenseCategoriesTree = useExpenseCategoriesTree();
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');

  // Mutations
  const { delete: deleteCategory, isDeleting } = useMutations();

  // Filter categories based on search
  const filteredIncome = useMemo(
    () => filterCategories(incomeCategoriesTree, searchQuery),
    [incomeCategoriesTree, searchQuery],
  );

  const filteredExpense = useMemo(
    () => filterCategories(expenseCategoriesTree, searchQuery),
    [expenseCategoriesTree, searchQuery],
  );

  // Handlers
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

    if (confirm(message)) {
      await deleteCategory(category.id);
    }
  };

  // Count categories
  const incomeCount = countCategories(incomeCategoriesTree);
  const expenseCount = countCategories(expenseCategoriesTree);

  // Get flat list for dialog based on type
  const dialogCategories = newCategoryType === 'income' ? incomeCategories : expenseCategories;

  return (
    <>
      {/* Main content */}
      <main className="w-full mx-auto px-6">
        {/* Search and stats */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              aria-label="Search categories"
              placeholder="Search..."
              value={searchQuery}
              className="pl-8 h-9"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Income tree */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden="true" className="size-2 rounded-full bg-success" />
                Income

                <Badge
                  variant="secondary"
                  className="gap-1.5 px-2 py-1 text-2xs font-normal"
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                  {incomeCount} income
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)] min-h-72">
                <div className="p-3">
                  <CategoryTree
                    categories={filteredIncome}
                    type="income"
                    onAddNew={handleAddNew}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Expense tree */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden="true" className="size-2 rounded-full bg-destructive" />
                Expense
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-2 py-1 text-2xs font-normal"
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />
                  {expenseCount} expense
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)] min-h-72">
                <div className="p-3">
                  <CategoryTree
                    categories={filteredExpense}
                    type="expense"
                    onAddNew={handleAddNew}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

        {/* Dialog */}
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
