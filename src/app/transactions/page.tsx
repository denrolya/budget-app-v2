import { ArrowRightLeft, Eye, MoreHorizontal } from 'lucide-react';
import React from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Updated mock data to include multiple compensations
const mockData = [
  {
    date: '2023-07-01',
    totalSum: 220,
    transactionCount: 2,
    transferCount: 1,
    items: [
      {
        id: 'T001',
        type: 'transaction',
        amount: 50,
        account: 'Checking',
        category: 'Groceries',
        executionDate: '2023-07-01 09:30',
        description: 'Grocery shopping',
        note: 'Weekly groceries',
      },
      {
        id: 'TR001',
        type: 'transfer',
        amount: 200,
        from: 'Savings',
        to: 'Checking',
        executionDate: '2023-07-01 14:00',
        exchangeRate: 1,
        fees: 0,
        fromTransaction: {
          id: 'T002',
          amount: -200,
          account: 'Savings',
          category: 'Transfer',
          executionDate: '2023-07-01 14:00',
          description: 'Transfer to Checking',
          note: 'Monthly budget transfer',
        },
        toTransaction: {
          id: 'T003',
          amount: 200,
          account: 'Checking',
          category: 'Transfer',
          executionDate: '2023-07-01 14:00',
          description: 'Transfer from Savings',
          note: 'Monthly budget transfer',
        },
      },
      {
        id: 'T004',
        type: 'transaction',
        amount: -30,
        account: 'Credit Card',
        category: 'Dining',
        executionDate: '2023-07-01 20:15',
        description: 'Restaurant bill',
        note: 'Dinner with friends',
        compensationIds: ['T006', 'T007'],
      },
    ],
  },
  {
    date: '2023-07-02',
    totalSum: 985,
    transactionCount: 3,
    transferCount: 0,
    items: [
      {
        id: 'T005',
        type: 'transaction',
        amount: -15,
        account: 'Debit Card',
        category: 'Food & Drink',
        executionDate: '2023-07-02 08:45',
        description: 'Coffee shop',
        note: 'Morning coffee',
      },
      {
        id: 'T006',
        type: 'transaction',
        amount: 20,
        account: 'Checking',
        category: 'Compensation',
        executionDate: '2023-07-02 09:00',
        description: 'Partial compensation for dinner',
        note: 'Reimbursement for T004',
        compensatedId: 'T004',
      },
      {
        id: 'T007',
        type: 'transaction',
        amount: 10,
        account: 'Checking',
        category: 'Compensation',
        executionDate: '2023-07-02 10:00',
        description: 'Final compensation for dinner',
        note: 'Reimbursement for T004',
        compensatedId: 'T004',
      },
    ],
  },
];

const TransactionDetails = ({ transaction, allTransactions }) => {
  const compensations = transaction.compensationIds
    ? transaction.compensationIds.map(id => allTransactions.find(t => t.id === id)).filter(Boolean)
    : [];
  const compensatedTransaction = transaction.compensatedId
    ? allTransactions.find(t => t.id === transaction.compensatedId)
    : null;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(transaction).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{key}</TableCell>
              <TableCell>{typeof value === 'object' ? JSON.stringify(value) : value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {compensations.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Compensation Transactions:</h3>
          <div className="space-y-2">
            {compensations.map(comp => (
              <TransactionItem key={comp.id} transaction={comp} allTransactions={allTransactions} isCompensationView />
            ))}
          </div>
        </div>
      )}
      {compensatedTransaction && (
        <div>
          <h3 className="font-semibold mb-2">Compensated Transaction:</h3>
          <TransactionItem transaction={compensatedTransaction} allTransactions={allTransactions} isCompensationView />
        </div>
      )}
    </div>
  );
};

const TransferDetails = ({ transfer }) => (
  <div className="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Field</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(transfer).map(([key, value]) => {
          if (key !== 'fromTransaction' && key !== 'toTransaction') {
            return (
              <TableRow key={key}>
                <TableCell className="font-medium">{key}</TableCell>
                <TableCell>{typeof value === 'number' ? value.toFixed(2) : value}</TableCell>
              </TableRow>
            );
          }
          return null;
        })}
      </TableBody>
    </Table>
    <div>
      <h3 className="font-semibold mb-2">Related Transactions:</h3>
      <div className="space-y-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">View From Transaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>From Transaction Details</DialogTitle>
            </DialogHeader>
            <TransactionDetails transaction={transfer.fromTransaction} allTransactions={[]} />
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">View To Transaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>To Transaction Details</DialogTitle>
            </DialogHeader>
            <TransactionDetails transaction={transfer.toTransaction} allTransactions={[]} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
);

const TransferItem = ({ transfer }) => (
    <Card className="my-2 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-accent/50">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  <span className="font-medium font-mono">${transfer.amount.toFixed(2)}</span>
                  <span className="text-muted-foreground hidden sm:inline">{transfer.from} → {transfer.to}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{transfer.executionDate}</span>
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
                  <span>From: {transfer.from}</span>
                  <span>To: {transfer.to}</span>
                  <span>Date: {transfer.executionDate}</span>
                  <span>Exchange Rate: {transfer.exchangeRate}</span>
                  <span>Fees: ${transfer.fees.toFixed(2)}</span>
                </div>
                <TransactionItem transaction={transfer.fromTransaction} allTransactions={[]} />
                <TransactionItem transaction={transfer.toTransaction} allTransactions={[]} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );

const TransactionItem = ({ transaction, allTransactions, isCompensationView = false }) => {
  const compensations = transaction.compensationIds
    ? transaction.compensationIds.map(id => allTransactions.find(t => t.id === id)).filter(Boolean)
    : [];
  const isCompensated = compensations.length > 0;
  const isCompensation = Boolean(transaction.compensatedId);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant={transaction.amount >= 0 ? 'default' : 'destructive'} className="text-xs font-mono">
              ${Math.abs(transaction.amount).toFixed(2)}
            </Badge>
            <span className="font-medium truncate max-w-[150px] sm:max-w-none">{transaction.description}</span>
            {(isCompensated || isCompensation) && (
              <Badge variant="outline" className="text-xs">
                {isCompensated ? 'Compensated' : 'Compensation'}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{transaction.category}</Badge>
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
                  <TransactionDetails transaction={transaction} allTransactions={allTransactions} />
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
          <span>{transaction.account}</span>
          <span>{transaction.executionDate}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Component() {
  const allTransactions = mockData.flatMap(group => group.items);

  return (
    <div className="w-full p-2 sm:p-4 bg-background">
      <Accordion type="single" collapsible className="w-full space-y-2">
        {mockData.map((dateGroup, index) => (
          <AccordionItem value={`item-${index}`}
                         key={index}
                         className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-accent/50">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{dateGroup.date}</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    ${dateGroup.totalSum.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex space-x-2 text-xs text-muted-foreground">
                  <span>{dateGroup.transactionCount} transactions</span>
                  <span>{dateGroup.transferCount} transfers</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 px-4 py-2">
              {dateGroup.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {item.type === 'transaction' ? (
                    <TransactionItem transaction={item} allTransactions={allTransactions} />
                  ) : (
                    <TransferItem transfer={item} />
                  )}
                </React.Fragment>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
