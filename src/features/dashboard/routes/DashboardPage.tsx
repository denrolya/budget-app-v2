import React from 'react';

import DashboardKpiStrip from '@/features/dashboard/components/DashboardKpiStrip';
import {
  CategoriesTimelineCard as CategoriesTimeline,
  DistributionDonutCard as DistributionDonut,
  MoneyFlowCard as MoneyFlow,
} from '@/features/statistics';

const DashboardPage: React.FC = () => {
  return (
    <section className="h-full w-full overflow-auto p-4">
      <DashboardKpiStrip />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 lg:items-stretch">
        <MoneyFlow className="lg:col-span-7 lg:row-start-1 h-full" />
        <CategoriesTimeline className="lg:col-span-7 lg:row-start-2 h-full" />
        <DistributionDonut className="min-h-[600px] lg:min-h-0 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 h-full" />
      </div>
    </section>
  );
};

export default DashboardPage;
