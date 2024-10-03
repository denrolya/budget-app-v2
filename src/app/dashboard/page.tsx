import React, { useState } from 'react';

import ExampleHorizontalScrollCardWithTooltip
  from '@/components/features/statistics/ExampleHorizontalScrollCardWithTooltip.tsx';
import CardStack from '@/components/common/CardStack';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import { CardConfig, cardConfigs } from '@/constants/dashboard-config';

const DashboardPage: React.FC = () => {
  const [configs, setConfigs] = useState<CardConfig[]>(cardConfigs);
  const handleConfigChange = (id: string, newConfig: Partial<CardConfig>) => {
    setConfigs(prevConfigs =>
      prevConfigs.map(config =>
        config.id === id ? { ...config, ...newConfig } : config,
      ),
    );
  };

  return (
    <section className="p-6">
      {/* Mobile view: CardStack */}
      <div className="md:hidden mb-6">
        <CardStack
          cards={configs.map(card => (
            <StatisticsCard
              key={card.id}
              {...card}
              config={configs[card.id]}
              onConfigChange={(newConfig) => handleConfigChange(card.id, newConfig)}
            />
          ))}
        />
      </div>

      {/* Desktop view: Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center mb-6">
        {configs.map(card => (
          <StatisticsCard
            key={card.id}
            {...card}
            config={configs[card.id]}
            onConfigChange={(newConfig) => handleConfigChange(card.id, newConfig)}
          />
        ))}
      </div>

      <MoneyFlow />

      <ExampleHorizontalScrollCardWithTooltip />
    </section>
  );
};

export default DashboardPage;
