import React, { useState } from 'react';

import InputForm from '@/components/features/transactions/InputForm.tsx';
import DraftForm from '@/components/features/transactions/DraftForm';
import CategoryTreeCard from '@/components/features/statistics/CategoryTreeCard';
import FinancialCard from '@/components/features/statistics/FinancialCard';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import { CardConfig, cardConfigs } from '@/constants/dashboard-config';

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
      <DraftForm />
      <InputForm />
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="col-span-5 md:col-span-3">
          <MoneyFlow />
        </div>
        <div className="col-span-5 md:col-span-2">
          <CategoryTreeCard />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 justify-items-center mb-6">
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
