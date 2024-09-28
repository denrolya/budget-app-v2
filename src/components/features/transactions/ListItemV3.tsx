import cn from 'classnames';
import { Eye, User } from 'lucide-react';
import React from 'react';

import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transactions/Details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import Transaction from '@/models/Transaction';

interface TransactionItemProps {
  transaction: Transaction;
  colorBorder?: boolean;
}

export const ListItem: React.FC<TransactionItemProps> = ({ transaction, colorBorder = false }) => {
  const { openForm } = useFormContext();

  return (
    <Card
      className={cn('mb-0.5 hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors relative group overflow-visible', {
        'border-l-2 border-l-green-500': colorBorder && transaction.isIncome(),
        'border-l-2 border-l-red-500': colorBorder && transaction.isExpense(),
      })}
    >
      <CardContent className="p-2 flex flex-col space-y-1">
        <div className="flex flex-row items-center justify-between">
          <div className="flex-grow flex items-center space-x-2 overflow-x-auto">
            <TransactionValue transaction={transaction} className="text-xs" />
            <AccountBadge account={transaction.account} size="sm" />
            {transaction?.debt?.debtor && (
              <Badge variant="outline" className="text-[10px] flex items-center px-1">
                <User className="h-3 w-3 mr-1" />
                {transaction.debt.debtor}
              </Badge>
            )}
            {transaction.isDraft && (
              <Badge variant="outline" className="bg-primary text-primary-foreground text-[10px] px-1">Draft</Badge>
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
              <Dialog>
                <DialogTrigger className="m-0" asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                  </DialogHeader>
                  <Details transaction={transaction} onEdit={() => openForm(FormType.Transaction, transaction)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        {transaction.note && (
          <ResponsiveTooltip
            openDelay={0}
            content={<p>{transaction.note}</p>}
            triggerClassName="w-full overflow-hidden"
          >
            <p className="text-sm text-muted-foreground truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {transaction.note}
            </p>
          </ResponsiveTooltip>
        )}
      </CardContent>
      <Badge
        variant="outline"
        className="absolute top-0 left-0 -mt-3 -ml-3 text-xs px-1 py-0 whitespace-nowrap z-10"
      >
        {transaction.category.name}
      </Badge>
    </Card>
  );
};

export const ListItemSkeleton: React.FC = () => (
  <Card className="mb-0.5 relative overflow-visible">
    <CardContent className="p-2 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-grow flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-row items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-5 w-full" />
    </CardContent>
    <Skeleton className="absolute top-0 left-0 h-4 w-16 -mt-2 -ml-2 z-10" />
  </Card>
);

export default ListItem;
