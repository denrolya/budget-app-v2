import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon, PlusCircleIcon, LineChartIcon, ListIcon, MenuIcon } from 'lucide-react';

import { useScreenSize } from '@/hooks/useScreenSize.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DatePicker } from '@/components/ui/date-picker';

type Budget = {
  id: string
  name: string
  startDate: Date
  endDate?: Date
  categories: Category[]
}

type Category = {
  id: string
  name: string
  budgeted: number
  actual: number
  children?: Category[]
}

export const BudgetPage = () => {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: 'monthly',
      name: 'Monthly Budget',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      categories: [
        { id: 'income', name: 'Income', budgeted: 5000, actual: 4800 },
        { id: 'expenses', name: 'Expenses', budgeted: 4000, actual: 3800, children: [
            { id: 'housing', name: 'Housing', budgeted: 1500, actual: 1500 },
            { id: 'food', name: 'Food', budgeted: 500, actual: 450 },
            { id: 'transportation', name: 'Transportation', budgeted: 300, actual: 280 },
          ] },
      ],
    },
    {
      id: 'yearly',
      name: 'Yearly Budget',
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(new Date().getFullYear(), 11, 31),
      categories: [
        { id: 'income', name: 'Income', budgeted: 60000, actual: 30000 },
        { id: 'expenses', name: 'Expenses', budgeted: 50000, actual: 25000 },
      ],
    },
    {
      id: 'lambo',
      name: 'Lambo Savings',
      startDate: new Date(),
      categories: [
        { id: 'savings', name: 'Savings', budgeted: 200000, actual: 50000 },
      ],
    },
  ]);

  const isDesktop = useScreenSize();

  const handleBudgetSelect = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    setSelectedBudget(budget || null);
  };

  const calculateProgress = (budgeted: number, actual: number) => Math.min((actual / budgeted) * 100, 100);

  const updateBudgetDates = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (selectedBudget && startDate) {
      const updatedBudgets = budgets.map(budget =>
        budget.id === selectedBudget.id ? { ...budget, startDate, endDate } : budget
      );
      setBudgets(updatedBudgets);
      setSelectedBudget({ ...selectedBudget, startDate, endDate });
    }
  };

  const Sidebar = () => (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Budgets</h2>
      <Button className="mb-4">
        <PlusCircleIcon className="mr-2 h-4 w-4" /> New Budget
      </Button>
      <div className="space-y-2">
        {budgets.map(budget => (
          <Button
            key={budget.id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleBudgetSelect(budget.id)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" /> {budget.name}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background dark:bg-gray-900 text-foreground dark:text-gray-100">
      {/* Sidebar for desktop */}
      {isDesktop && (
        <aside className="w-64 border-r p-4 flex flex-col dark:border-gray-700">
          <Sidebar />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar */}
        <header className="border-b p-4 flex justify-between items-center dark:border-gray-700">
          <div className="flex items-center">
            {!isDesktop && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2" aria-label="Open menu">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-4">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-2xl font-bold mr-4">
              {selectedBudget ? selectedBudget.name : 'Select a Budget'}
            </h1>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estimates">Estimates</SelectItem>
                <SelectItem value="actuals">Actuals</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <LineChartIcon className="mr-2 h-4 w-4" /> Statistics
            </Button>
            <Button variant="outline">
              <ListIcon className="mr-2 h-4 w-4" /> Logs
            </Button>
          </div>
        </header>

        {/* Budget Details */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {selectedBudget ? (
            <div className="space-y-6">
              {/* Date Range */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <DatePicker
                  date={selectedBudget.startDate}
                  setDate={(date) => updateBudgetDates(date, selectedBudget.endDate)}
                  label="Start Date"
                />
                <DatePicker
                  date={selectedBudget.endDate}
                  setDate={(date) => updateBudgetDates(selectedBudget.startDate, date)}
                  label="End Date (Optional)"
                />
              </div>

              {/* Categories */}
              <div className="space-y-4">
                {selectedBudget.categories.map(category => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    calculateProgress={calculateProgress}
                  />
                ))}
              </div>

              <Button variant="outline" size="sm">
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Select a budget from the sidebar to view details
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CategoryItem({ category, calculateProgress, depth = 0 }: { category: Category, calculateProgress: (budgeted: number, actual: number) => number, depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-2">
      <div
        className={'flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-muted dark:bg-gray-800 rounded-md'}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <div className="flex items-center mb-2 sm:mb-0">
          {category.children && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
              className="mr-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`}
              />
            </button>
          )}
          <span>{category.name}</span>
        </div>
        <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0">
          <Input
            type="number"
            value={category.budgeted}
            className="w-24"
            aria-label={`Budgeted amount for ${category.name}`}
          />
          <span className="text-muted-foreground">USD</span>
          <Progress
            value={calculateProgress(category.budgeted, category.actual)}
            className="w-24"
            aria-label={`Progress for ${category.name}`}
          />
          <span aria-live="polite">{category.actual} / {category.budgeted}</span>
        </div>
      </div>
      {isExpanded && category.children && (
        <div className="pl-4">
          {category.children.map(childCategory => (
            <CategoryItem
              key={childCategory.id}
              category={childCategory}
              calculateProgress={calculateProgress}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BudgetPage;
