import React from 'react';

import MonthExpensesRadialBarChart from '@/components/features/dashboard/MonthExpensesRadialBarChart';
import ExpenseSunburstChart from '@/components/features/dashboard/Sunburst';

const TestingPage: React.FC = () => (
  <section className="p-4">
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 space-x-2">
      <ExpenseSunburstChart type="expense" />
      <ExpenseSunburstChart type="income" />
    </div>

    <div className="mb-6">
      <MonthExpensesRadialBarChart />
    </div>
  </section>
);

export default TestingPage;
