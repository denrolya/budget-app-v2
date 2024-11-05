import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import React, { useMemo } from 'react';

import MonthExpensesRadialBarChart from '@/components/features/statistics/MonthExpensesRadialBarChart.Example';
import ExpenseSunburstChart from '@/components/features/statistics/Sunburst.Example';
import TimelineChart from '@/components/features/statistics/TimelineChart.Example';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

type CalendarData = {
  day: string;
  value: number;
}

type TreeMapData = {
  name: string;
  children?: TreeMapData[];
  value?: number;
}

type Category = {
  name: string;
  subcategories: {
    name: string;
    items: string[];
  }[];
}

const generateMonthData = (startDate: Date, endDate: Date): CalendarData[] =>
  eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
    day: format(date, 'yyyy-MM-dd'),
    value: Math.max(1, Math.floor(Math.random() * 100)), // Ensure minimum value of 1
  }));

const generateNestedTreemapData = (categories: Category[], isExpense: boolean): TreeMapData => ({
  name: isExpense ? 'Expenses' : 'Income',
  children: categories.map(category => ({
    name: category.name,
    children: category.subcategories.map(subcategory => ({
      name: subcategory.name,
      children: subcategory.items.map(item => ({
        name: item,
        value: Math.max(1, Math.floor(Math.random() * 1000) + 100), // Ensure minimum value of 1
      })),
    })),
  })),
});

const expenseCategories: Category[] = [
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

const incomeCategories: Category[] = [
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

type FinancialStatisticsDrawerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const FinancialStatisticsDrawer = ({ isOpen, setIsOpen }: FinancialStatisticsDrawerProps) => {
  const today = new Date();
  const monthStart = startOfMonth(subMonths(today, 2));
  const monthEnd = endOfMonth(today);

  const calendarData = useMemo(() => generateMonthData(monthStart, monthEnd), [monthStart, monthEnd]);
  const expenseData = useMemo(() => generateNestedTreemapData(expenseCategories, true), []);
  const incomeData = useMemo(() => generateNestedTreemapData(incomeCategories, false), []);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="h-[95vh] max-w-full">
        <DrawerHeader className="px-4 py-2 sm:px-6">
          <DrawerTitle className="text-lg sm:text-xl font-bold">
            Financial Statistics - {format(today, 'MMMM yyyy')}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground sr-only">
            Overview of transactions, cash flow, expenses, and income
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="flex flex-col space-y-3">
            <section className="flex flex-col md:flex-row md:space-x-4">
              <CalendarChart
                title="Transactions per Day"
                data={calendarData}
                monthStart={monthStart}
                monthEnd={monthEnd}
                className="flex-1"
              />
            </section>
            <section className="flex flex-row justify-between">
              <ExpenseSunburstChart type="expense" />
              <ExpenseSunburstChart type="income" />
            </section>
            <section className="flex flex-col space-y-4">
              <h2 className="text-xl font-semibold">Detailed Breakdown</h2>
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
                <TreeMapChart title="Expense Categories" data={expenseData} className="flex-1" />
                <TreeMapChart title="Income Categories" data={incomeData} className="flex-1" />
              </div>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              <div className="text-sm">
                <p>Transaction details to be implemented</p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

type CalendarChartProps = {
  title: string;
  data: CalendarData[];
  monthStart: Date;
  monthEnd: Date;
  className?: string;
}

const CalendarChart = ({ title, data, monthStart, monthEnd, className }: CalendarChartProps) => (
    <div className={className}>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveCalendar
          data={data}
          from={format(monthStart, 'yyyy-MM-dd')}
          to={format(monthEnd, 'yyyy-MM-dd')}
          emptyColor="#eeeeee"
          colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
          margin={{ top: 20, right: 10, bottom: 20, left: 10 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          dayBorderWidth={2}
          dayBorderColor="#ffffff"
          legends={[
            {
              anchor: 'bottom',
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
  );

type TreeMapChartProps = {
  title: string;
  data: TreeMapData;
  className?: string;
}

const TreeMapChart = ({ title, data, className }: TreeMapChartProps) => (
    <div className={className}>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveTreeMap
          data={data}
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
  );

export default FinancialStatisticsDrawer;
