import cn from 'classnames';
import { MoreVertical, User } from 'lucide-react';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';
import { MOMENT_TIME_VIEW_FORMAT } from '@/constants/datetime.ts';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import Details from '@/components/features/transactions/Details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { Transaction, Type } from '@/models/transaction';

interface TransactionItemProps {
  transaction: Transaction;
  colorBorder?: boolean;
}

export const ListItem: React.FC<TransactionItemProps> = ({ transaction, colorBorder = false }) => {
  const { openForm } = useFormContext();
  return (
    <Card
      className={cn('mb-0.5 hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors', {
        'border-l-2 border-l-green-500': colorBorder && transaction.type === Type.Income,
        'border-l-2 border-l-red-500': colorBorder && transaction.type === Type.Expense,
      })}
    >
      <CardContent className="p-2 flex flex-row">
        <div className="flex flex-col flex-1">
          <div className="flex justify-between">
            <AccountBadge account={transaction.account} size="sm" />
            <Badge variant={(transaction.type === Type.Income) ? 'success' : 'destructive'}
                   className={cn('text-xs font-mono')}>
              <TransactionValue transaction={transaction} />
            </Badge>
          </div>
          <div className="flex justify-between">
            <div>
              <Badge variant="outline" className="text-xs px-1 py-0 w-fit">
                {transaction.category.name}
              </Badge>
              {transaction.note && (
                <ResponsiveTooltip openDelay={0} content={<p>{transaction.note}</p>} triggerClassName="text-left">
                <span className="text-xs text-muted-foreground truncate">
                  {transaction.note}
                </span>
                </ResponsiveTooltip>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {transaction.executedAt.format(MOMENT_TIME_VIEW_FORMAT)}
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
              </DialogHeader>
              <Details transaction={transaction} onEdit={() => openForm(FormType.Transaction, transaction, true)} />
              <div className="flex items-center space-x-2 mt-4">
                {transaction?.debt?.debtor && (
                  <Badge variant="outline" className="text-xs flex items-center px-1">
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
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};


export const ListItemSkeleton: React.FC = () => (
  <Card className="mb-0.5">
    <CardContent className="p-2 flex flex-row items-center justify-between">
      <div className="flex flex-col space-y-2 flex-1">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-full ml-2" />
    </CardContent>
  </Card>
);


export default ListItem;
