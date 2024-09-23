import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';
import { MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import TransactionListItemV2 from '@/components/features/transactions/ListItemV2';
import { ListItem as TransferListItem } from '@/components/features/transfers/ListItem';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import Transaction, { Type } from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { generateTransactions } from '@/services/transactionGenerator';
import { generateTransfers } from '@/services/transferGenerator';

interface GroupedData {
  date: string;
  totalSum: number;
  transactionCount: number;
  transferCount: number;
  items: (Transaction | Transfer)[];
}

const groupItemsByDate = (items: (Transaction | Transfer)[]): GroupedData[] => {
  const groupedData = items.reduce((acc: GroupedData[], item) => {
    const date = item.executedAt.format(MOMENT_DATE_VIEW_FORMAT);
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

export const DailyLedger = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState<GroupedData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (): Promise<GroupedData[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));

      return groupItemsByDate([
        ...generateTransactions(5, '2024-01-01', 1),
        ...generateTransfers(2, '2024-01-01'),
        ...generateTransactions(3, '2024-01-02', 1),
        ...generateTransfers(1, '2024-01-02'),
        ...generateTransactions(8, '2024-01-03', 1),
        ...generateTransfers(1, '2024-01-03'),
      ]);
    };

    setIsLoading(true);
    fetchData().then(v => {
      setData(v);
      setIsLoading(false);
    });
  }, []);

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
        </aside>

        {/* Main content area */}
        <main className="flex-1 space-y-4 sm:space-y-6">
          <div className="flex md:flex-col sm:flex-row justify-end items-start sm:items-center gap-4">

            <div className="w-full bg-background">
              {isLoading && (
                <div className="flex w-full items-center justify-between p-4 bg-background border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-all">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-24 bg-muted" /> {/* Date placeholder */}
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-28 bg-muted" /> {/* Transactions count placeholder */}
                    <Skeleton className="h-4 w-24 bg-muted" /> {/* Transfers count placeholder */}
                    <Skeleton className="h-5 w-20 bg-muted" /> {/* Total sum placeholder */}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </div>
                </div>
              )}
              <Accordion type="multiple" className="w-full space-y-2">
                {data.map((dateGroup, index) => (
                  <AccordionItem className="border rounded-lg overflow-hidden bg-card shadow-sm"
                                 value={`item-${index}`}
                                 key={index}>
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
                          {(item instanceof Transaction) && <TransactionListItemV2 transaction={item} />}
                          {(item instanceof Transfer) && <TransferListItem transfer={item} />}
                        </React.Fragment>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DailyLedger;
