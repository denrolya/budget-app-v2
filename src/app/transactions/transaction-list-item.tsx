import { Eye, MoreHorizontal } from 'lucide-react';
import { FC } from 'react';

import { MOMENT_TIME_VIEW_FORMAT } from '@/app/constants/datetime';
import { TransactionDetails } from '@/app/transactions/transaction-details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Transaction, Type } from '@/models/transaction';

interface TransactionListItemProps {
  transaction: Transaction;
  isCompensationView?: boolean;
}

export const TransactionListItem: FC<TransactionListItemProps> = ({ transaction, isCompensationView = false }) => {
  const isCompensated = transaction.type === Type.Expense && transaction.compensations && transaction.compensations?.length > 0;
  const isCompensation = transaction.category.name === 'Compensation';

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant={transaction.type === Type.Income ? 'default' : 'destructive'} className="text-xs font-mono">
              ${Math.abs(transaction.amount).toFixed(2)}
            </Badge>
            <span className="font-medium truncate max-w-[150px] sm:max-w-none">{transaction.category.name}</span>
            {(isCompensated || isCompensation) && (
              <Badge variant="outline" className="text-xs">
                {isCompensated ? 'Compensated' : 'Compensation'}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{transaction.category.name}</Badge>
            {!isCompensationView && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                  </DialogHeader>
                  <TransactionDetails transaction={transaction} />
                </DialogContent>
              </Dialog>
            )}
            {!isCompensationView && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit transaction</DropdownMenuItem>
                  <DropdownMenuItem>Delete transaction</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground flex justify-between">
          <span>{transaction.account.name}</span>
          <span>{transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
