import { SlidersHorizontal } from 'lucide-react';
import React, { useRef, useState } from 'react';
import moment from 'moment';

import { TransactionListItem } from '@/app/transactions/transaction-list-item';
import { TransferListItem } from '@/app/transactions/transfer-list-item';
import { Filters } from '@/components/transaction-filters';
import TransactionForm from '@/components/transaction-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, Type } from '@/models/transaction.ts';
import { Transfer } from '@/models/transfer.ts';
import { generateTransactions } from '@/services/transactions-generator.ts';
import { generateTransfers } from '@/services/transfers-generator.ts';

interface GroupedData {
  date: string;
  totalSum: number;
  transactionCount: number;
  transferCount: number;
  items: (Transaction | Transfer)[];
}

const groupItemsByDate = (items: (Transaction | Transfer)[]): GroupedData[] => {
  const groupedData = items.reduce((acc: GroupedData[], item) => {
    const date = item.executedAt.format('YYYY-MM-DD');
    const existingGroup = acc.find(group => group.date === date);

    if (existingGroup) {
      existingGroup.items.push(item);
      if (item instanceof Transaction) {
        existingGroup.transactionCount++;
        existingGroup.totalSum = item.type === Type.Income ? existingGroup.totalSum + item.amount : existingGroup.totalSum - item.amount;
      } else {
        existingGroup.transferCount++;
      }
    } else {
      acc.push({
        date,
        totalSum: (item instanceof Transaction ? (item.type === Type.Income ? item.amount : -item.amount) : 0),
        transactionCount: item instanceof Transaction ? 1 : 0,
        transferCount: item instanceof Transfer ? 1 : 0,
        items: [item],
      });
    }

    return acc;
  }, []);

  // Sort items in each group by executedAt in descending order
  groupedData.forEach(group => {
    group.items.sort((a, b) => moment(b.executedAt).valueOf() - moment(a.executedAt).valueOf());
  });

  return groupedData;
};

export default function Component() {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const formRef = useRef<{ submitForm: () => void } | null>(null);

  const mockData = groupItemsByDate([
    ...generateTransactions(5, '2024-01-01',1),
    ...generateTransfers(2, '2024-01-01'),
    ...generateTransactions(3, '2024-01-02',1),
    ...generateTransfers(1, '2024-01-02'),
    ...generateTransactions(8, '2024-01-03',1),
    ...generateTransfers(1, '2024-01-03')
  ]);

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
                        {(item instanceof Transaction) && <TransactionListItem transaction={item} />}
                        {(item instanceof Transfer) && <TransferListItem transfer={item} />}
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
