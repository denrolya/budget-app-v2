import React, { useState } from 'react';

import FinancialCard from '@/components/features/statistics/FinancialCard';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import { CardConfig, cardConfigs } from '@/constants/dashboard-config.ts';

const DashboardPage: React.FC = () => {
  const [configs, setConfigs] = useState(cardConfigs);
  const handleConfigChange = (id: string, newConfig: Partial<CardConfig>) => {
    setConfigs(prevConfigs =>
      prevConfigs.map(config =>
        config.id === id ? { ...config, ...newConfig } : config,
      ),
    );
  };
  return (
    <section className="p-6">
      <div className="w-full mb-6">
        <MoneyFlow />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center mb-6">
        {configs.map(card => (
          <FinancialCard
            key={card.id}
            {...card}
            onConfigChange={(id, newConfig) => handleConfigChange(id, newConfig)}
          />
        ))}
      </div>
    </section>
  );
};

export default DashboardPage;
