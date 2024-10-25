import cn from 'classnames';
import { Archive, Calendar, Download, Edit, Search } from 'lucide-react';
import moment from 'moment';
import React, { useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import DebtDetails from '@/components/features/debts/Details';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebts } from '@/contexts/FinanceData';

export const DebtsManagementPage: React.FC = () => {
  const debts = useDebts();
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const DebtList = () => (
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
              'bg-accent text-accent-foreground': selectedDebt?.id === debt.id,
            })}
            onClick={() => setSelectedDebt(debt)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{debt.debtor}</h3>
              </div>
              <MoneyValue
                badge
                amount={debt.balance}
                currency={debt.currency}
                values={debt.convertedValues} />
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
              Last updated: {moment(debt.updatedAt).fromNow()}
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

  return (
    <PageWithSidebar contentScrollable>
      <PageWithSidebar.Sidebar>
        <DebtList />
      </PageWithSidebar.Sidebar>
      {selectedDebt && (
        <PageWithSidebar.Header title="Debt Details" onBack={() => setSelectedDebt(null)}>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </PageWithSidebar.Header>
      )}

      <PageWithSidebar.Content>
        {(selectedDebt) && (
          <DebtDetails selectedDebt={selectedDebt} setSelectedDebt={setSelectedDebt} />
        )}

        {(!selectedDebt) && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select an debt to view details
          </div>
        )}
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default DebtsManagementPage;
