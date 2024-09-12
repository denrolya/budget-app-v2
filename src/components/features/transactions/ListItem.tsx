import { Eye, InfoIcon, MoreHorizontal, User } from 'lucide-react';
import { FC } from 'react';
import cn from 'classnames';

import { TransactionValue } from '@/components/common/TransactionValue';
import { Details } from '@/components/features/transactions/Details';
import { Avatar as AccountAvatar } from '@/components/features/accounts/Avatar';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { Transaction, Type } from '@/models/transaction';

interface TransactionListItemProps {
  transaction: Transaction;
  isCompensationView?: boolean;
  colorBorder?: boolean;
}

export const ListItem: FC<TransactionListItemProps> = ({ transaction, isCompensationView = false, colorBorder = false }) => {
  const isCompensated = transaction.type === Type.Expense && transaction.compensations && transaction.compensations?.length > 0;
  const isCompensation = transaction.category.name === 'Compensation';
  const isDebt = transaction.debt && transaction.debt.debtor;

  return (
    <Card className={cn('shadow-md hover:shadow-lg transition-shadow', {
      'border-l-4 border-l-green-500': colorBorder && transaction.type === Type.Income,
      'border-l-4 border-l-red-500': colorBorder && transaction.type === Type.Expense,
    })}>
      <CardContent className="p-2">
        <div className="flex items-center space-x-4">
          <AccountAvatar account={transaction.account} />
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm">
                <Badge className={cn('text-xs font-mono', {
                  'bg-green-500 hover:bg-green-600': transaction.type === Type.Income,
                  'bg-red-500 hover:bg-red-600': transaction.type === Type.Expense,
                })}>
                  <TransactionValue transaction={transaction} />
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium truncate max-w-[150px] sm:max-w-none cursor-help">
                        {transaction.category.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{transaction.category.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {(isCompensated || isCompensation) && (
                  <Badge variant="outline" className="text-xs">
                    {isCompensated ? 'Compensated' : 'Compensation'}
                  </Badge>
                )}
                {isDebt && (
                  <Badge variant="outline" className="text-xs flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {transaction.debt.debtor}
                  </Badge>
                )}
                {transaction.note && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{transaction.note}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center space-x-2">
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
                      <Details transaction={transaction} />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
