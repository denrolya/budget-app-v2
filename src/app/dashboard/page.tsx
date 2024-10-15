import React, { useState } from 'react';

import { generateSlug } from '@/utils/generateSlug';
import CardStack from '@/components/common/CardStack';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import { CardConfig, cardConfigs } from '@/constants/dashboard-config';

const DashboardPage: React.FC = () => {
  const [configs, setConfigs] = useState<CardConfig[]>(cardConfigs);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  const handleConfigChange = (index: number, newConfig: Partial<CardConfig>) => {
    setConfigs(prevConfigs =>
      prevConfigs.map((config, i) =>
        i === index ? { ...config, ...newConfig } : config
      )
    );
  };

  const handleAddNewConfig = (newConfig: CardConfig) => {
    setConfigs(prevConfigs => [...prevConfigs, newConfig]);
    setIsAddingNew(false);
  };

  return (
    <section className="p-6">
      {/* Mobile view: CardStack */}
      <div className="md:hidden mb-6">
        <CardStack
          cards={configs.map((card, index) => (
            <StatisticsCard
              key={`mobile-card-${generateSlug(card.title, card.type, card.statType)}`}
              config={card}
              onChange={(newConfig: CardConfig) => handleConfigChange(index, newConfig)}
            />
          ))}
        />
      </div>

      {/* Desktop view: Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center mb-6">
        {configs.map((card, index) => (
          <StatisticsCard
            key={`desktop-card-${generateSlug(card.title, card.type, card.statType)}`}
            config={card}
            onChange={(newConfig: CardConfig) => handleConfigChange(index, newConfig)}
          />
        ))}
      </div>

      <MoneyFlow className="mb-6" />
    </section>
  );
};

export default DashboardPage;
