import moment from 'moment';
import React from 'react';

import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BalanceProgressBar from '@/features/accounts/components/BalanceProgressbar.example';
import BalaneProgressbarStyled from '@/features/accounts/components/BalanceProgressbarStyled.example';
import BarChartWithDrawer from '@/features/sandbox/components/BarChartWithDrawer.example';
import CategoryValueWithinTimeframeSunburstChart
  from '@/features/sandbox/components/CategoryValueWithinTimeframeSunburstChart.example';
import ExpensesBySeasons from '@/features/sandbox/components/ExpensesBySeasons.example';
import FunnelWithDrawer from '@/features/sandbox/components/FunnelWithDrawer.example';
import MonthExpensesRadialBarChart from '@/features/sandbox/components/MonthExpensesRadialBarChart.example';
import ExpenseSunburstChart from '@/features/sandbox/components/Sunburst.example';
import { Type as TransactionType } from '@/features/transactions';
import {
  useActiveAccountsWithDefaultOrder,
  useExpenseCategoriesTree,
  useIncomeCategoriesTree,
} from '@/hooks/financeData';


const TestingPage: React.FC = () => {
  const expenseCategoriesTree = useExpenseCategoriesTree();
  const incomeCategoriesTree = useIncomeCategoriesTree();
  const accounts = useActiveAccountsWithDefaultOrder();

  return (
    <FullHeightPageContent>
      <Tabs defaultValue="nivo-charts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nivo-charts">Nivo Charts</TabsTrigger>
          <TabsTrigger value="other">Other stuff</TabsTrigger>
        </TabsList>
        <TabsContent value="nivo-charts">
          <h1>New Nivo Charts</h1>

          <BalaneProgressbarStyled />

          <div>
            <BalanceProgressBar accounts={accounts} />
            <CategoryValueWithinTimeframeSunburstChart
              after={moment().startOf('month')}
              before={moment().endOf('month')}
              type={TransactionType.Expense} />
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
        </TabsContent>
      </Tabs>
    </FullHeightPageContent>
  );
};

export default TestingPage;
