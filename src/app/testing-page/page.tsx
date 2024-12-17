import React from 'react';
import moment from 'moment';

import BalanceProgressBar from '@/components/features/accounts/BalanceProgressbar.example';
import BarChartWithDrawer from '@/components/features/statistics/BarChartWithDrawer.example';
import FunnelWithDrawer from '@/components/features/statistics/FunnelWithDrawer.example';
import MonthExpensesRadialBarChart from '@/components/features/statistics/MonthExpensesRadialBarChart.example';
import ExpenseSunburstChart from '@/components/features/statistics/Sunburst.example';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveAccountsWithDefaultOrder, useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/contexts/FinanceData';
import TreeDND from '@/components/features/categories/TreeDND.example';
import ExpensesBySeasons from '@/components/features/statistics/ExpensesBySeasons.example';
import CategoryValueWithinTimeframeSunburstChart from '@/components/features/statistics/CategoryValueWithinTimeframeSunburstChart.example';
import { Type as TransactionType } from '@/types/transaction';

const TestingPage: React.FC = () => {
  const expenseCategoriesTree = useExpenseCategoriesTree();
  const incomeCategoriesTree = useIncomeCategoriesTree();
  const accounts = useActiveAccountsWithDefaultOrder();

  return (
    <section className="p-4">
      <Tabs defaultValue="nivo-charts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nivo-charts">Nivo Charts</TabsTrigger>
          <TabsTrigger value="other">Other stuff</TabsTrigger>
        </TabsList>
        <TabsContent value="nivo-charts">
          <h1>New Nivo Charts</h1>

          <div>
            <BalanceProgressBar accounts={accounts} />
            <CategoryValueWithinTimeframeSunburstChart type={TransactionType.Expense} after={moment().startOf('month')} before={moment().endOf('month')} />
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
            <ExpenseSunburstChart categories={expenseCategoriesTree} />
            <ExpenseSunburstChart categories={incomeCategoriesTree} />
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
            <MonthExpensesRadialBarChart />
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
            <BarChartWithDrawer />
            <FunnelWithDrawer />
          </div>

          <ExpensesBySeasons />
        </TabsContent>
        <TabsContent value="other">
          <h1>Other random stuff</h1>
          <TreeDND />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default TestingPage;
