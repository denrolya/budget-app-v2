import React, { useState } from 'react';

import CategoryTreeCard from '@/components/features/statistics/CategoryTreeCard';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import DraftForm from '@/components/features/transactions/DraftForm';
import InputForm from '@/components/features/transactions/InputForm';
import { Card, CardContent } from '@/components/ui/card.tsx';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center mb-6">
        {configs.map(card => (
          <StatisticsCard
            key={card.id}
            {...card}
            onConfigChange={(id, newConfig) => handleConfigChange(id, newConfig)}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="col-span-5 md:col-span-3">
          <MoneyFlow />
        </div>
        <div className="col-span-5 md:col-span-2">
          <CategoryTreeCard />
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DraftForm />
            <InputForm />
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default DashboardPage;
