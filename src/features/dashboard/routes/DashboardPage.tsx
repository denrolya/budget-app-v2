import React from 'react';

import DashboardKpiStrip from '@/features/dashboard/components/DashboardKpiStrip';
import { DistributionDonutCard as DistributionDonut, MoneyFlowCard as MoneyFlow } from '@/features/statistics';

const DashboardPage: React.FC = () => (
  <section className="h-full w-full overflow-auto p-4">
    <DashboardKpiStrip />

    <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 lg:items-stretch">
      <MoneyFlow className="lg:col-span-8 h-full" />
      <DistributionDonut className="min-h-[500px] lg:min-h-0 lg:col-span-4 h-full" />
    </div>
  </section>
);

export default DashboardPage;
