import { CalendarIcon, PlusCircleIcon } from 'lucide-react';
import React, { useState } from 'react';

import { Budget } from '@/app/budget/page';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'monthly',
    name: 'Monthly Budget',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    categories: [
      { id: 'income', name: 'Income', budgeted: 5000, actual: 4800 },
      {
        id: 'expenses',
        name: 'Expenses',
        budgeted: 4000,
        actual: 3800,
        children: [
          { id: 'housing', name: 'Housing', budgeted: 1500, actual: 1500 },
          { id: 'food', name: 'Food', budgeted: 500, actual: 450 },
          { id: 'transportation', name: 'Transportation', budgeted: 300, actual: 280 },
        ],
      },
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
    categories: [{ id: 'savings', name: 'Savings', budgeted: 200000, actual: 50000 }],
  },
];

interface Props {
  selected: Budget | null;
  onSelect: (budget: Budget) => void;
}

const SidebarListing: React.FC<Props> = ({ selected, onSelect }) => {
  const [budgets] = useState<Budget[]>(INITIAL_BUDGETS);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow">
        <div className="space-y-1 p-2">
          {budgets.map((budget) => (
            <Button
              key={budget.id}
              variant={selected?.id === budget.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onSelect(budget)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{budget.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-border">
        <Button className="w-full">
          <PlusCircleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>New Budget</span>
        </Button>
      </div>
    </div>
  );
};

export default SidebarListing;
