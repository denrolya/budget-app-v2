import { ArrowDownCircle, ArrowUpCircle, LayoutList, Settings2, Table } from 'lucide-react';
import React, { useCallback } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Type as TransactionType } from '@/features/transactions';

interface Props {
  activeView: string;
  setActiveView: (view: 'table' | 'list') => void;
  showEmpty: boolean;
  setShowEmpty: (show: boolean) => void;
  isCompactTable: boolean;
  setIsCompactTable: (compact: boolean) => void;
  showTransactions: boolean;
  setShowTransactions: (show: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (show: boolean) => void;
  transactionFilters: {
    isDraft?: boolean | null;
    type?: TransactionType | undefined;
  };
  setFilter: (key: string, value: any) => void;
}

const DisplayMenu: React.FC<Props> = ({
  activeView,
  setActiveView,
  showEmpty,
  setShowEmpty,
  isCompactTable,
  setIsCompactTable,
  showTransactions,
  setShowTransactions,
  showTransfers,
  setShowTransfers,
  transactionFilters,
  setFilter,
}) => {
  const isMobile = useIsMobile();

  const onTransactionTypeChange = useCallback(
    (type: TransactionType | undefined) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
      setFilter('categories', []); // Reset categories when changing type
      setShowTransactions(true);
      setShowTransfers(false);
    },
    [setFilter, setShowTransactions, setShowTransfers],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">View Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {!isMobile && (
          <>
            <DropdownMenuLabel>View Mode</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={activeView} onValueChange={(v) => setActiveView(v as 'list' | 'table')}>
              <DropdownMenuRadioItem value="list">
                <LayoutList className="mr-2 h-4 w-4" /> List
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="table">
                <Table className="mr-2 h-4 w-4" /> Table
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={showEmpty}
              disabled={activeView !== 'table'}
              onCheckedChange={(v) => setShowEmpty(v)}
            >
              Show empty days
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={isCompactTable}
              disabled={activeView !== 'table'}
              onCheckedChange={(v) => setIsCompactTable(v)}
            >
              Compact mode
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel>Visibility</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={showTransactions} onCheckedChange={setShowTransactions}>
          Transactions
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showTransfers} onCheckedChange={setShowTransfers}>
          Transfers
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Draft Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={
            transactionFilters.isDraft === true ? 'drafts' : transactionFilters.isDraft === false ? 'noDrafts' : 'all'
          }
          onValueChange={(value) => {
            setFilter('isDraft', value === 'drafts' ? true : value === 'noDrafts' ? false : null);
            setShowTransfers(value === 'all');
          }}
        >
          <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="drafts">Drafts</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="noDrafts">No Drafts</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={showTransactions && (transactionFilters.type === TransactionType.Income || !transactionFilters.type)}
          disabled={!showTransactions}
          onCheckedChange={() =>
            onTransactionTypeChange(
              transactionFilters.type === TransactionType.Income ? undefined : TransactionType.Income,
            )
          }
        >
          <ArrowDownCircle className="mr-2 h-4 w-4 text-success" /> Income
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          disabled={!showTransactions}
          checked={
            showTransactions && (transactionFilters.type === TransactionType.Expense || !transactionFilters.type)
          }
          onCheckedChange={() =>
            onTransactionTypeChange(
              transactionFilters.type === TransactionType.Expense ? undefined : TransactionType.Expense,
            )
          }
        >
          <ArrowUpCircle className="mr-2 h-4 w-4 text-destructive" /> Expense
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DisplayMenu;
