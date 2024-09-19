import cn from 'classnames';
import { MoreVertical, User } from 'lucide-react';

import TransactionValue from '@/components/common/TransactionValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
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

export const ListItem = ({ transaction, colorBorder = false }: TransactionItemProps) => {
  const { openForm } = useFormContext();
  return (
    <Card
      className={cn('mb-0.5 hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors', {
        'border-l-2 border-l-green-500': colorBorder && transaction.type === Type.Income,
        'border-l-2 border-l-red-500': colorBorder && transaction.type === Type.Expense,
      })}
    >
      <CardContent className="p-2 flex items-center">
        <div className="flex-shrink-0 mr-2">
          <ResponsiveTooltip openDelay={0} content={<span className="font-medium">{transaction.account.name}</span>}>
            <span>
              <AccountAvatar account={transaction.account} className="h-full w-full" size="sm" />
            </span>
          </ResponsiveTooltip>
        </div>

        <div className="flex-grow min-w-0 mr-2">
          <div className="flex flex-col">
            <Badge variant="outline" className="text-xs px-1 py-0 w-fit mb-1">
              {transaction.category.name}
            </Badge>
            {transaction.note && (
              <ResponsiveTooltip openDelay={0} content={<p>{transaction.note}</p>} triggerClassName="text-left">
                <span className="text-xs text-muted-foreground truncate block">
                  {transaction.note}
                </span>
              </ResponsiveTooltip>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 mr-2 text-right">
          <Badge variant={(transaction.type === Type.Income) ? 'success' : 'destructive'}
                 className={cn('text-xs font-mono')}>
            <TransactionValue transaction={transaction} />
          </Badge>
          <div className="text-xs text-muted-foreground">
            {transaction.executedAt.format('DD MMM HH:mm')}
          </div>
        </div>

        <div className="flex-shrink-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(event) => event.preventDefault()}>
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

export default ListItem;
