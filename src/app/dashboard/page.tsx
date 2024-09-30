import React, { useState } from 'react';

import CategoryTreeCard from '@/components/features/statistics/CategoryTreeCard';
import FinancialCard from '@/components/features/statistics/FinancialCard';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import DraftForm from '@/components/features/transactions/DraftForm';
import InputForm from '@/components/features/transactions/InputForm';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { CardConfig, cardConfigs } from '@/constants/dashboard-config';
import TypeaheadV2   from '@/components/ui/typeaheadV2';

const DashboardPage: React.FC = () => {
  const [configs, setConfigs] = useState<CardConfig[]>(cardConfigs);
  const handleConfigChange = (id: string, newConfig: Partial<CardConfig>) => {
    setConfigs(prevConfigs =>
      prevConfigs.map(config =>
        config.id === id ? { ...config, ...newConfig } : config,
      ),
    );
  };

  const [value, setValue] = useState<string | string[] | null>(null);
  const options = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' },
  ];

  return (
    <section className="p-6">
      <TypeaheadV2
        options={options}
        valueField="id"
        labelField="name"
        renderElement={(option) => option.name}
        value={value}
        onChange={setValue}
        multiple={false}
      />
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
