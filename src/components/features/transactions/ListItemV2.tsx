import { Edit2Icon, Eye, Trash2Icon, User } from 'lucide-react';
import { useMemo } from 'react';
import cn from 'classnames';

import { useForm as useFormContext } from '@/contexts/Form.tsx';
import TransactionValue from '@/components/common/TransactionValueV2';
import AccountAvatar from '@/components/features/accounts/Avatar';
import Details from '@/components/features/transactions/Details.tsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAccounts } from '@/contexts/FinanceData.tsx';
import { Transaction, Type } from '@/models/transaction';


interface TransactionItemProps {
  transaction: Transaction;
  colorBorder?: boolean;
}

export const ListItem = ({ transaction, colorBorder = false }: TransactionItemProps) => {
  const { openForm } = useFormContext();
  const accounts = useAccounts();
  const account = useMemo(() => accounts.find(account => account.id === transaction.account.id), [accounts, transaction.account?.id]);

  const amountColor = transaction.isIncome()
    ? 'text-success dark:text-success'
    : 'text-destructive dark:text-destructive';

  return (
    <Card className={cn('mb-1 hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors', {
      'border-l-4 border-l-green-500': colorBorder && transaction.type === Type.Income,
      'border-l-4 border-l-red-500': colorBorder && transaction.type === Type.Expense,
    })}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 flex-grow">
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <AccountAvatar account={account} className="h-full w-full" size="sm" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-medium">{transaction.account.name}</span>
              </TooltipContent>
            </Tooltip>
            <Badge variant="outline" className="text-xs">
              {transaction.category.name}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className={`font-bold ${amountColor}`}>
                <TransactionValue transaction={transaction} />
              </div>
            </div>
            <div className="text-right text-xs">
              <div>{transaction.executedAt.format('HH:mm')}</div>
              <div className="text-muted-foreground">{transaction.executedAt.format('DD MMM')}</div>
            </div>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {transaction.note}
                </span>
            </TooltipTrigger>
            {transaction.note && (
              <TooltipContent>
                <p>{transaction.note}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <div className="flex items-center space-x-1">
            {transaction?.debt?.debtor && (
              <Badge variant="outline" className="text-xs flex items-center">
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
                <Details transaction={transaction} onEdit={() => openForm('transaction', transaction, true)} />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openForm('transaction', transaction, true)}>
              <Edit2Icon className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
              <Trash2Icon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListItem;
