import React from 'react';

import MonthExpensesRadialBarChart from '@/components/features/statistics/MonthExpensesRadialBarChart.Example';
import ExpenseSunburstChart from '@/components/features/statistics/Sunburst.Example';
import TimelineChart from '@/components/features/statistics/TimelineChart.Example';
import BarChartWithDrawer from '@/components/features/statistics/BarChartWithDrawer.Example';
import FunnelWithDrawer from '@/components/features/statistics/FunnelWithDrawer.Example';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardWithChart from '@/components/features/statistics/CardWithChart.Example';

const TestingPage: React.FC = () => (
  <section className="p-4">
    <Tabs defaultValue="nivo-charts">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="nivo-charts">Nivo Charts</TabsTrigger>
        <TabsTrigger value="other">Other stuff</TabsTrigger>
      </TabsList>
      <TabsContent value="nivo-charts">
        <h1>New Nivo Charts</h1>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
          <ExpenseSunburstChart type="expense" />
          <ExpenseSunburstChart type="income" />
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
          <MonthExpensesRadialBarChart />
          <TimelineChart />
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
          <BarChartWithDrawer />
          <FunnelWithDrawer />
        </div>
      </TabsContent>
      <TabsContent value="other">
        <h1>Other random stuff</h1>

      </TabsContent>
    </Tabs>
  </section>
);

export default TestingPage;
