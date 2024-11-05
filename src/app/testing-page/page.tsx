import React from 'react';

import BarChartWithDrawer from '@/components/features/statistics/BarChartWithDrawer.example';
import FunnelWithDrawer from '@/components/features/statistics/FunnelWithDrawer.example';
import MonthExpensesRadialBarChart from '@/components/features/statistics/MonthExpensesRadialBarChart.example';
import ExpenseSunburstChart from '@/components/features/statistics/Sunburst.example';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/contexts/FinanceData';
import TreeDND from '@/components/features/categories/TreeDND.example';

const TestingPage: React.FC = () => {
  const expenseCategoriesTree = useExpenseCategoriesTree();
  const incomeCategoriesTree = useIncomeCategoriesTree();

  return (
    <section className="p-4">
      <Tabs defaultValue="nivo-charts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nivo-charts">Nivo Charts</TabsTrigger>
          <TabsTrigger value="other">Other stuff</TabsTrigger>
        </TabsList>
        <TabsContent value="nivo-charts">
          <h1>New Nivo Charts</h1>

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
