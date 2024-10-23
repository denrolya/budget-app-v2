import React, { useState } from 'react';

import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import { CardConfig, cardConfigs } from '@/constants/dashboard-config';
import { generateSlug } from '@/utils/generateSlug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardPage: React.FC = () => {
  const [configs, setConfigs] = useState<CardConfig[]>(cardConfigs);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  const handleConfigChange = (index: number, newConfig: Partial<CardConfig>) => {
    setConfigs(prevConfigs =>
      prevConfigs.map((config, i) =>
        i === index ? { ...config, ...newConfig } : config,
      ),
    );
  };

  const handleAddNewConfig = (newConfig: CardConfig) => {
    setConfigs(prevConfigs => [...prevConfigs, newConfig]);
    setIsAddingNew(false);
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
          {configs.map((card, index) => (
            <StatisticsCard
              key={`desktop-card-${generateSlug([card.title, card.type, card.statType])}`}
              config={card}
              onChange={(newConfig: CardConfig) => handleConfigChange(index, newConfig)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3 md:col-span-2">
          <MoneyFlow className="mb-6" />
        </div>
        <div className="col-span-3 md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Content</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
);
};

export default DashboardPage;
