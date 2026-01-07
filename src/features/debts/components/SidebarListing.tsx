import cn from 'classnames';
import { Archive, Calendar, Search } from 'lucide-react';
import React, { useState } from 'react';

import Debt from '@/features/debts/models/Debt';
import { useDebts } from '@/hooks/financeData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import MoneyValue from '@/components/common/MoneyValue';

interface Props {
  selected: Debt | null;
  onSelect: (debt: Debt) => void;
}

const SidebarListing: React.FC<Props> = ({ selected, onSelect }) => {
  const debts = useDebts();
  const [showArchived, setShowArchived] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Debts</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search accounts" className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={cn('p-4 border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
              'bg-accent text-accent-foreground': selected?.id === debt.id,
            })}
            onClick={() => onSelect(debt)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{debt.debtor}</h3>
              </div>
              <MoneyValue badge amount={debt.balance} currency={debt.currency} values={debt.convertedValues} />
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              {debt.closedAt && (
                <span className="flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Closed
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              Last updated: {debt.updatedAt?.fromNow()}
            </div>
          </div>
        ))}
        <div className="p-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidebarListing;
