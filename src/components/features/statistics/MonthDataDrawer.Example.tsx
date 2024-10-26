
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

const generateMonthData = (startDate, endDate) => eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
  day: format(date, 'yyyy-MM-dd'),
  value: Math.floor(Math.random() * 10),
  amount: Math.floor(Math.random() * 1000) - 500,
}));

const generateNestedTreemapData = (categories, isExpense) => ({
  name: isExpense ? 'Expenses' : 'Income',
  children: categories.map(category => ({
    name: category.name,
    children: category.subcategories.map(subcategory => ({
      name: subcategory.name,
      children: subcategory.items.map(item => ({
        name: item,
        value: Math.floor(Math.random() * 1000) + 100,
      })),
    })),
  })),
});

const expenseCategories = [
  {
    name: 'Housing',
    subcategories: [
      { name: 'Rent', items: ['Monthly Rent', 'Security Deposit'] },
      { name: 'Utilities', items: ['Electricity', 'Water', 'Gas', 'Internet'] },
    ],
  },
  {
    name: 'Food',
    subcategories: [
      { name: 'Groceries', items: ['Supermarket', 'Farmers Market'] },
      { name: 'Dining Out', items: ['Restaurants', 'Fast Food', 'Cafes'] },
    ],
  },
  {
    name: 'Transportation',
    subcategories: [
      { name: 'Public Transit', items: ['Bus', 'Subway', 'Train'] },
      { name: 'Private Vehicle', items: ['Fuel', 'Maintenance', 'Insurance'] },
    ],
  },
];

const incomeCategories = [
  {
    name: 'Employment',
    subcategories: [
      { name: 'Salary', items: ['Base Pay', 'Overtime', 'Bonuses'] },
      { name: 'Benefits', items: ['Health Insurance', 'Retirement Contributions'] },
    ],
  },
  {
    name: 'Investments',
    subcategories: [
      { name: 'Stocks', items: ['Dividends', 'Capital Gains'] },
      { name: 'Real Estate', items: ['Rental Income', 'Property Appreciation'] },
    ],
  },
  {
    name: 'Other',
    subcategories: [
      { name: 'Freelance', items: ['Consulting', 'Gig Work'] },
      { name: 'Miscellaneous', items: ['Gifts', 'Refunds', 'Royalties'] },
    ],
  },
];

export default function FinancialStatisticsDrawer({ isOpen, setIsOpen }) {
  const [activeTab, setActiveTab] = useState('overview');

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const calendarData = useMemo(() => generateMonthData(monthStart, monthEnd), [monthStart, monthEnd]);
  const expenseData = useMemo(() => generateNestedTreemapData(expenseCategories, true), []);
  const incomeData = useMemo(() => generateNestedTreemapData(incomeCategories, false), []);

  const tabs = ['overview', 'transactions', 'expenses', 'income'];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">View Financial Statistics</Button>
      </DrawerTrigger>
      <DrawerContent className="h-[95vh] max-w-full">
        <DrawerHeader className="px-4 py-2 sm:px-6">
          <DrawerTitle className="text-lg sm:text-xl font-bold">Financial Statistics
                                                                - {format(today, 'MMMM yyyy')}</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">Overview of transactions, cash flow, expenses,
                                                                       and income</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div {...handlers}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 bg-card text-card-foreground rounded-lg p-4 shadow-md">
                    <h3 className="text-base font-semibold">Transactions per Day</h3>
                    <div className="h-[300px] sm:h-[400px]">
                      <ResponsiveCalendar
                        data={calendarData}
                        from={format(monthStart, 'yyyy-MM-dd')}
                        to={format(monthEnd, 'yyyy-MM-dd')}
                        emptyColor="#eeeeee"
                        colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                        yearSpacing={40}
                        monthBorderColor="#ffffff"
                        dayBorderWidth={2}
                        dayBorderColor="#ffffff"
                        legends={[
                          {
                            anchor: 'bottom-right',
                            direction: 'row',
                            translateY: 36,
                            itemCount: 4,
                            itemWidth: 42,
                            itemHeight: 36,
                            itemsSpacing: 14,
                            itemDirection: 'right-to-left',
                          },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 bg-card text-card-foreground rounded-lg p-4 shadow-md">
                    <h3 className="text-base font-semibold">Cash Flow per Day</h3>
                    <div className="h-[300px] sm:h-[400px]">
                      <ResponsiveCalendar
                        data={calendarData.map(d => ({ ...d, value: d.amount }))}
                        from={format(monthStart, 'yyyy-MM-dd')}
                        to={format(monthEnd, 'yyyy-MM-dd')}
                        emptyColor="#eeeeee"
                        colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                        yearSpacing={40}
                        monthBorderColor="#ffffff"
                        dayBorderWidth={2}
                        dayBorderColor="#ffffff"
                        legends={[
                          {
                            anchor: 'bottom-right',
                            direction: 'row',
                            translateY: 36,
                            itemCount: 4,
                            itemWidth: 42,
                            itemHeight: 36,
                            itemsSpacing: 14,
                            itemDirection: 'right-to-left',
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="transactions" className="mt-0">
                <div className="bg-card text-card-foreground rounded-lg p-4 shadow-md">
                  <h3 className="text-base font-semibold mb-2">Detailed Transactions</h3>
                  <div className="text-sm">Transaction details to be implemented</div>
                </div>
              </TabsContent>
              <TabsContent value="expenses" className="mt-0">
                <div className="bg-card text-card-foreground rounded-lg p-4 shadow-md">
                  <h3 className="text-base font-semibold mb-2">Expense Categories</h3>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveTreeMap
                      data={expenseData}
                      identity="name"
                      value="value"
                      valueFormat=".02s"
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      labelSkipSize={12}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
                      parentLabelPosition="left"
                      parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
                      colors={{ scheme: 'nivo' }}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="income" className="mt-0">
                <div className="bg-card text-card-foreground rounded-lg p-4 shadow-md">
                  <h3 className="text-base font-semibold mb-2">Income Categories</h3>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveTreeMap
                      data={incomeData}
                      identity="name"
                      value="value"
                      valueFormat=".02s"
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      labelSkipSize={12}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
                      parentLabelPosition="left"
                      parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
                      colors={{ scheme: 'nivo' }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
