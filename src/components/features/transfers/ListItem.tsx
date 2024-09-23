import { ArrowRightLeft, Eye } from 'lucide-react';

import { ListItem as TransactionListItem } from '@/components/features/transactions/ListItem';
import { Details as TransferDetails } from '@/components/features/transfers/Details';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Transfer from '@/models/Transfer';

interface TransferItemProps {
  transfer: Transfer;
}

export const ListItem: React.FC<TransferItemProps> = ({ transfer }) => (
  <Card className="my-2 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="p-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-accent/50">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <span className="font-medium font-mono">${transfer.amount.toFixed(2)}</span>
                <span className="text-muted-foreground hidden sm:inline">{transfer.fromExpense.account.name} → {transfer.toIncome.account.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{transfer.executedAt.format()}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Transfer Details</DialogTitle>
                    </DialogHeader>
                    <TransferDetails transfer={transfer} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>From: {transfer.fromExpense.account.name}</span>
                <span>To: {transfer.toIncome.account.name}</span>
                <span>Date: {transfer.executedAt.format()}</span>
                <span>Exchange Rate: {transfer.rate}</span>
                {transfer.hasFee() && (
                  <span>Fees: ${transfer.feeExpense.amount.toFixed(2)} paid from {transfer.feeExpense.account.name}</span>
                )}
              </div>
              <TransactionListItem transaction={transfer.fromExpense} />
              <TransactionListItem transaction={transfer.toIncome} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
);

export default ListItem;
