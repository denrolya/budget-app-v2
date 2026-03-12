import { Eye, User } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import AccountPill from '@/features/accounts/components/Pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';

import Transaction from '../models/Transaction';

import Details from './Details';
import TransactionValue from './TransactionValue';

interface TransactionItemProps {
  transaction: Transaction;
  colorBorder?: boolean;
  isCompensationView?: boolean;
}

export const ListItem: React.FC<TransactionItemProps> = ({ transaction, colorBorder = false }) => {
  const truncateNote = (note: string, maxLength: number) => {
    if (note.length <= maxLength) return note;
    return `${note.substring(0, maxLength)}...`;
  };

  return (
    <Card
      className={cn('ease-in-out hover:shadow-md dark:hover:shadow-primary/25 transition-colors group relative', {
        'border-l-2 border-success': colorBorder && transaction.isIncome(),
        'border-l-2 border-destructive': colorBorder && transaction.isExpense(),
        'bg-warning/15 dark:bg-warning/10': transaction.isDraft,
      })}
    >
      <CardContent className="p-2 flex flex-col space-y-1">
        <div className="flex flex-row items-center justify-between">
          <div className="flex-grow flex items-center space-x-2 overflow-x-auto">
            <TransactionValue transaction={transaction} className="text-xs" />
            <AccountPill account={transaction.account} size="sm" />
            {transaction?.debt?.debtor && (
              <Badge variant="outline" className="text-[10px] flex items-center px-1">
                <User className="h-3 w-3 mr-1" />
                {transaction.debt.debtor}
              </Badge>
            )}

            {transaction.compensations && transaction.compensations.length > 0 && (
              <Badge variant="outline" className="bg-secondary text-secondary-foreground text-[10px] px-1">
                Compensated
              </Badge>
            )}
          </div>

          <div className="flex flex-row items-center space-x-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
            </span>
            <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Sheet>
                <SheetTrigger asChild className="m-0">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                  <SheetHeader>
                    <SheetTitle>Transaction Details</SheetTitle>
                    <SheetDescription className="sr-only">Transaction details for {transaction.id}</SheetDescription>
                  </SheetHeader>
                  <Details transaction={transaction} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        {transaction.note && (
          <ResponsiveTooltip
            openDelay={0}
            content={<p>{transaction.note}</p>}
            triggerClassName="w-full overflow-hidden"
          >
            <p className="text-sm text-muted-foreground truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
              {truncateNote(transaction.note, 50)}
            </p>
          </ResponsiveTooltip>
        )}
      </CardContent>
      <Badge
        variant="outline"
        className="absolute top-0 left-0 -translate-y-1/2 text-xs px-1 py-0 whitespace-nowrap z-10 bg-background shadow-md"
      >
        {transaction.category.name}
      </Badge>
    </Card>
  );
};

export default ListItem;
