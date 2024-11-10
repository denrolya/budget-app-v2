import { ChevronDownIcon, LineChartIcon, ListIcon, PlusCircleIcon } from 'lucide-react';
import React, { useState } from 'react';

import { ROUTES } from '@/constants/routes';
import SidebarListing from '@/components/features/budget/SidebarListing';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type Budget = {
  id: string
  name: string
  startDate: Date
  endDate?: Date
  categories: Category[]
}

export type Category = {
  id: string
  name: string
  budgeted: number
  actual: number
  children?: Category[]
}

export const BudgetManagementPage = () => {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const { icon: Icon } = ROUTES.BUDGET_PAGE;

  const calculateProgress = (budgeted: number, actual: number) => Math.min((actual / budgeted) * 100, 100);

  const updateBudgetDates = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (selectedBudget && startDate) {
      const updatedBudgets = budgets.map(budget =>
        budget.id === selectedBudget.id ? { ...budget, startDate, endDate } : budget,
      );
      setBudgets(updatedBudgets);
      setSelectedBudget({ ...selectedBudget, startDate, endDate });
    }
  };

  return (
    <PageWithSidebar contentScrollable>
      <PageWithSidebar.Sidebar>
        <SidebarListing selected={selectedBudget} onSelect={setSelectedBudget} />
      </PageWithSidebar.Sidebar>
      {selectedBudget && (
        <PageWithSidebar.Header
          overrideContent
          title={`${selectedBudget.name} Budget`}
          onBack={() => setSelectedBudget(null)}>
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold mr-4">
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
          <div className="flex space-x-2 mt-2 md:mt-0">
            <Button variant="outline" size="sm" className="md:size-md">
              <LineChartIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Statistics</span>
            </Button>
            <Button variant="outline" size="sm" className="md:size-md">
              <ListIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Logs</span>
            </Button>
          </div>
        </PageWithSidebar.Header>
      )}
      <PageWithSidebar.Content>
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 space-y-6">
            {selectedBudget ? (
              <>
                <section>
                  <h2 className="text-lg font-semibold mb-4">Budget Period</h2>
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
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-4">Categories</h2>
                  <div className="space-y-4">
                    {selectedBudget.categories.map(category => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        calculateProgress={calculateProgress}
                      />
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    <PlusCircleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Add Category</span>
                  </Button>
                </section>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted -m-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="h-8 w-8 text-primary/60" />
                  </div>
                  <p className="text-muted-foreground max-w-[250px]">
                    Select a category from the sidebar to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

const CategoryItem = ({ category, calculateProgress, depth = 0 }: {
  category: Category,
  calculateProgress: (budgeted: number, actual: number) => number,
  depth?: number
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-1">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border-b border-border"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <div className="flex items-center mb-2 sm:mb-0">
          {category.children && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
              className="mr-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`}
                aria-hidden="true"
              />
            </button>
          )}
          <span className="font-medium">{category.name}</span>
        </div>
        <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0">
          <Input
            type="number"
            value={category.budgeted}
            onChange={(e) => {/* Handle budget update */
            }}
            className="w-24"
            aria-label={`Budgeted amount for ${category.name}`}
          />
          <span className="text-muted-foreground">USD</span>
          <Progress
            value={calculateProgress(category.budgeted, category.actual)}
            className="w-24"
            aria-label={`Progress for ${category.name}`}
          />
          <span aria-live="polite" className="text-sm">
            {category.actual} / {category.budgeted}
          </span>
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
};

export default BudgetManagementPage;

