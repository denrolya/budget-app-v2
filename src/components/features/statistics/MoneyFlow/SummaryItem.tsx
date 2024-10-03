import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';

interface Props {
  icon: React.FC<{ className?: string; size?: number }>;
  label: string;
  value: string;
  colors?: boolean;
  showSign?: boolean;
}

const SummaryItem: React.FC<Props> = ({ icon: IconComponent, label, colors = false, showSign = false, value }) => (
  <div>
    <p className="text-muted-foreground flex items-center">
      <IconComponent className="mr-2" size={16} />
      {label}
    </p>
    <MoneyValue className="font-medium" useColors={colors} showSign={showSign} amount={value} />
  </div>
);

export default SummaryItem;
