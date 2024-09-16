import { FC } from 'react';

import MoneyValue from '@/components/common/MoneyValue';

interface SummaryItemProps {
  icon: FC<{ className?: string; size?: number }>;
  label: string;
  value: string;
}

const SummaryItem: FC<SummaryItemProps> = ({ icon: IconComponent, label, value }) => (
  <div>
    <p className="text-muted-foreground flex items-center">
      <IconComponent className="mr-2" size={16} />
      {label}
    </p>
    <p className="font-medium"><MoneyValue showSign amount={value} /></p>
  </div>
);

export default SummaryItem;
