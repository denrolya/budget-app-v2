import cn from 'classnames';
import { ChevronLeft, Download, Edit, Folder, FolderClosed, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import CategoryTypeahead from '@/components/common/CategoryTypeahead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useScreenSize } from '@/hooks/useScreenSize';
import Category from '@/models/Category';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
}

interface Props {
  category: Category;
  setSelectedCategory: (category: Category | null) => void;
  allCategories: Category[];
}

const mockTransactions: Transaction[] = [
  { id: '1', date: '2023-10-15', description: 'Grocery shopping', amount: 120.50, categoryId: '1' },
  { id: '2', date: '2023-10-14', description: 'Restaurant dinner', amount: 85.00, categoryId: '1' },
  { id: '3', date: '2023-10-12', description: 'Supermarket', amount: 65.75, categoryId: '1' },
  { id: '4', date: '2023-10-10', description: 'Local cafe', amount: 12.30, categoryId: '1' },
  { id: '5', date: '2023-10-08', description: 'Food delivery', amount: 32.99, categoryId: '1' },
];

export const CategoryDetails: React.FC<Props> = ({ category, setSelectedCategory, allCategories }) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [editMode, setEditMode] = useState(false);
  const [editedCategory, setEditedCategory] = useState(category);
  const [notes, setNotes] = useState('');
  const isDesktop = useScreenSize();

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    setEditMode(false);
    // Update the category in the parent component or global state
    setSelectedCategory(editedCategory);
  };

  const renderTransactionContent = () => {
    if (mockTransactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <p className="text-lg font-semibold">No transactions found</p>
          <p className="text-sm text-muted-foreground">There are no transactions for this category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {mockTransactions.map((transaction) => (
          <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <Badge variant={transaction.amount > 0 ? 'default' : 'destructive'}>
              <MoneyValue amount={transaction.amount} />
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <header className="bg-background border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => setSelectedCategory(null)}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back to list</span>
          </Button>
          <h1 className="text-xl font-bold">Category Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Add new</span>
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                {editedCategory.children.length > 0 ? (
                  <Folder className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <FolderClosed className="h-6 w-6 text-primary-foreground" />
                )}
              </div>
              <div>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>
                  Created: {new Date(editedCategory.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={editedCategory.name}
                    onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category-parent">Parent Category</Label>
                  <CategoryTypeahead
                    id="category-parent"
                    multiple={false}
                    valueField="id"
                    type={editedCategory.type}
                    value={editedCategory.parent.id}
                    onChange={(parents) => setEditedCategory({ ...editedCategory, parent: parents[0] || null })}
                    className="h-9 w-full"
                    categories={allCategories.filter(c => c.id !== editedCategory.id)}
                  />
                </div>
                <div>
                  <Label htmlFor="category-root">Root Category</Label>
                  <CategoryTypeahead
                    id="category-root"
                    multiple={false}
                    valueField="id"
                    type={editedCategory.type}
                    value={editedCategory.root.id}
                    onChange={(roots) => setEditedCategory({ ...editedCategory, root: roots[0] || null })}
                    className="h-9 w-full"
                    categories={allCategories.filter(c => !c.parent)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Type:</strong> {editedCategory.type}</p>
                <p>
                  <strong>Parent:</strong> {editedCategory.parent ? editedCategory.parent?.name : 'No Parent'}
                </p>
                <p>
                  <strong>Root:</strong> {editedCategory.root ? editedCategory.root?.name : 'No Root'}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Add notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-4"
            />
          </CardContent>
          <CardFooter>
            {editMode ? (
              <Button onClick={handleSave}>Save Changes</Button>
            ) : (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Edit Category
              </Button>
            )}
          </CardFooter>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn({ 'grid w-full grid-cols-2': !isDesktop })}>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="history">Category History</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>List of all transactions in this category</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {renderTransactionContent()}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Category History</CardTitle>
                <CardDescription>Timeline of changes related to this category</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-4">
                    {[
                      { id: 1, date: '2023-06-15', action: 'Category created', details: 'Initial setup' },
                      {
                        id: 2,
                        date: '2023-07-01',
                        action: 'Category renamed',
                        details: 'Changed from "Food" to "Groceries"',
                      },
                      {
                        id: 3,
                        date: '2023-08-01',
                        action: 'Parent category changed',
                        details: 'Moved under "Living Expenses"',
                      },
                    ].map((event) => (
                      <li key={event.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        </div>
                        <Badge variant="secondary">{new Date(event.date).toLocaleDateString()}</Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryDetails;
