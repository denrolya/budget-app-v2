import React, { useState } from 'react';

import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import TimelineChart from '@/components/features/statistics/TimelineChart.example';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardConfigs } from '@/constants/dashboard-config';
import { StatisticsConfig } from '@/types/statistics';
import { generateSlug } from '@/utils/generateSlug';

const DashboardPage: React.FC = () => {
  const [configs] = useState<StatisticsConfig[]>(cardConfigs);

  const handleConfigChange = (newConfig: Partial<StatisticsConfig>) => {
    console.log(newConfig);
  };

  return (
    <section className="p-6">
      <div className="w-full">
        <MoneyFlow className="mb-6" />
      </div>

      <div className="w-full relative overflow-hidden mb-6">
        <div
          className="flex overflow-x-auto space-x-4 snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          aria-label="Scrollable card container"
        >
          {configs.map((card) => (
            <StatisticsCard
              key={`desktop-card-${generateSlug([card.title, card.type, card.statType])}`}
              config={card}
              onChange={handleConfigChange}
            />
          ))}
        </div>
      </div>

      <div className="w-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Categories Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineChart />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DashboardPage;
