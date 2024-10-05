import React from 'react';

import ExpenseSunburstChart from '@/components/features/dashboard/Sunburst';
import Treemap from '@/components/features/dashboard/Treemap';

const TestingPage: React.FC = () => (
  <section className="p-4">
    <div className="mb-6">
      <ExpenseSunburstChart type="expense" />
      <ExpenseSunburstChart type="income" />
    </div>
  </section>
);

export default TestingPage;
