import React, { useState } from 'react';

import BalanceByAccountType from '@/components/features/statistics/BalanceByAccountType';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import TimelineChart from '@/components/features/statistics/TimelineChart.example';
import TotalBalanceCard from '@/components/features/statistics/TotalBalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cardConfigs } from '@/constants/dashboard-config';
import { Type as AccountType } from '@/types/account';
import { StatisticsConfig } from '@/types/statistics';
import { generateSlug } from '@/utils/generateSlug';

const DashboardPage: React.FC = () => {
  const [configs] = useState(cardConfigs);
  const tabGroups = Object.keys(configs).filter(group => group !== 'global');

  const handleConfigChange = (newConfig: Partial<StatisticsConfig>) => {
    console.log(newConfig);
  };

  return (
    <section className="p-6">
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
          <BalanceByAccountType type={AccountType.Cash} />
          <BalanceByAccountType type={AccountType.Bank} />
          <TotalBalanceCard />
          {configs.global.map((card: StatisticsConfig) => (
            <StatisticsCard
              key={`statistics-card-global-${generateSlug([card.title, card.type, card.statType])}`}
              config={card}
              onChange={handleConfigChange}
            />
          ))}
        </div>
      </div>

      <div className="w-full">
        <MoneyFlow className="mb-6" />
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs className="space-y-4" defaultValue={tabGroups[0]}>
          <TabsList>
            {tabGroups.map((group, index) => (
              <TabsTrigger className="capitalize" value={group} key={index}>
                {group}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabGroups.map((group) => (
            <TabsContent value={group} key={group}>
              <div
                className="flex overflow-x-auto space-x-4 snap-x snap-mandatory mb-6"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                aria-label="Scrollable card container"
              >
                {configs[group].map((card: StatisticsConfig) => (
                  <StatisticsCard
                    key={`statistics-card-${group}-${generateSlug([card.title, card.type, card.statType])}`}
                    config={card}
                    onChange={handleConfigChange}
                  />
                ))}
              </div>
              {group === 'categorySpecific' && (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Categories Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimelineChart />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default DashboardPage;
