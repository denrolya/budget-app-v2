import { ArrowRightLeft, Eye, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Filters } from '@/components/transaction-filters';
import TransactionForm from '@/components/transaction-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Transaction example
// {
//             "id": 12992,
//             "account": {
//                 "icon": "ion-ios-card",
//                 "id": 10,
//                 "name": "Mono UAH",
//                 "currency": "UAH",
//                 "color": "#DAA520"
//             },
//             "amount": 266.88,
//             "convertedValues": {
//                 "BTC": 0.00012014461688354172,
//                 "EUR": 5.869300521140137,
//                 "HUF": 2312.229469684902,
//                 "UAH": 266.88,
//                 "USD": 6.510562688178345
//             },
//             "note": "Test note",
//             "executedAt": "2024-09-07T06:19:00+00:00",
//             "category": {
//                 "id": 160,
//                 "name": "Test Category",
//                 "icon": ""
//             },
//             "isDraft": false,
//             "compensations": [],
//             "type": "expense"
//         }

// Transfer example data
// {
//             "id": 597,
//             "from": {
//                 "id": 2,
//                 "name": "Cash EUR",
//                 "currency": "EUR",
//                 "color": "#4682B4",
//                 "icon": "ion-ios-cash"
//             },
//             "to": {
//                 "id": 9,
//                 "name": "Cash HUF",
//                 "currency": "HUF",
//                 "color": "#FF4500",
//                 "icon": "ion-ios-cash"
//             },
//             "amount": 160,
//             "rate": 390,
//             "fee": 0,
//             "note": "",
//             "executedAt": "2024-08-12T13:42:00+00:00"
//         }

interface Transaction {
  id: string;
  type: 'transaction';
  amount: number;
  account: string;
  category: string;
  executionDate: string;
  description: string;
  note: string;
  compensationIds?: string[];
  compensatedId?: string;
  from?: string;
  to?: string;
  exchangeRate?: number;
  fees?: number;
  fromTransaction?: Transaction;
  toTransaction?: Transaction;
}

interface Transfer {
  id: string;
  type: 'transfer';
  amount: number;
  from: string;
  to: string;
  executionDate: string;
  exchangeRate: number;
  fees: number;
  fromTransaction: Transaction;
  toTransaction: Transaction;
}

interface TransactionDetailsProps {
  transaction: Transaction;
  allTransactions: Transaction[];
}

interface TransferDetailsProps {
  transfer: Transfer;
}

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

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction, allTransactions }) => {
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
              comp &&
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

const TransferDetails: React.FC<TransferDetailsProps> = ({ transfer }) => (
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
                <TableCell>{typeof value === 'number' ? (value as number).toFixed(2) : (value as string)}</TableCell>
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

interface TransferItemProps {
  transfer: Transfer;
}

const TransferItem: React.FC<TransferItemProps> = ({ transfer }) => (
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

interface TransactionItemProps {
  transaction: Transaction;
  allTransactions: Transaction[];
  isCompensationView?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, allTransactions, isCompensationView = false }) => {
  const compensations: Transaction[] = transaction.compensationIds
    ? transaction.compensationIds
      .map(id => allTransactions.find(t => t.id === id) as Transaction)
      .filter(Boolean)
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
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const formRef = useRef<{ submitForm: () => void } | null>(null);

  const handleSubmit = async (values: never) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(values);
      // Close the dialog after successful submission
      document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold">Your Transactions</h2>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Drawer for filters on mobile */}
        <Drawer open={showFilters} onOpenChange={setShowFilters}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="lg:hidden mb-4">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh] flex flex-col">
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Refine your transaction list</DrawerDescription>
            </DrawerHeader>
            <div className="flex-grow overflow-y-auto px-4 pb-4">
              <Filters />
            </div>
            <DrawerFooter className="p-4 border-t">
              <DrawerClose asChild>
                <Button className="w-full">Apply Filters</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Sidebar for filters on desktop */}
        <aside className="hidden lg:block w-64 space-y-6">
          <Filters />
        </aside>

        {/* Main content area */}
        <main className="flex-1 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
            <Select>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>

            {/* Desktop version - Dialog */}
            <div className="hidden md:block">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Add New Transaction</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>New Transaction</DialogTitle>
                    <DialogDescription>
                      Add a new transaction to your finances
                    </DialogDescription>
                  </DialogHeader>
                  <TransactionForm
                    ref={formRef}
                    onSubmit={handleSubmit}
                    onFormStateChange={setIsFormValid}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={() => formRef.current?.submitForm()}
                      disabled={isLoading || !isFormValid}
                      className="w-full"
                    >
                      {isLoading ? 'Submitting...' : 'Submit'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile version - Drawer */}
            <Drawer open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
              <DrawerTrigger asChild>
                <Button className="w-full md:hidden">Add New Transaction</Button>
              </DrawerTrigger>
              <DrawerContent className="h-[80vh] flex flex-col">
                <DrawerHeader>
                  <DrawerTitle>New Transaction</DrawerTitle>
                  <DrawerDescription>
                    Add a new transaction to your finances
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex-grow overflow-y-auto px-4 pb-4">
                  <TransactionForm
                    ref={formRef}
                    onSubmit={handleSubmit}
                    onFormStateChange={setIsFormValid}
                  />
                </div>
                <DrawerFooter className="p-4 border-t">
                  <Button
                    type="submit"
                    onClick={() => formRef.current?.submitForm()}
                    disabled={isLoading || !isFormValid}
                    className="w-full"
                  >
                    {isLoading ? 'Submitting...' : 'Submit'}
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="w-full bg-background">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {mockData.map((dateGroup, index) => (
                <AccordionItem value={`item-${index}`}
                               key={index}
                               className="border rounded-lg overflow-hidden bg-card shadow-sm">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-accent/50">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{dateGroup.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{dateGroup.transactionCount} transactions</span>
                        <span>{dateGroup.transferCount} transfers</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          ${dateGroup.totalSum.toFixed(2)}
                        </Badge>
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
        </main>
      </div>
    </div>
  );
}
