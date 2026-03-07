import React from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const DISPLAY_CURRENCIES = ['EUR', 'HUF', 'USD', 'UAH'] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

interface Props {
  value: DisplayCurrency;
  onChange: (value: DisplayCurrency) => void;
}

const BudgetDisplayCurrency: React.FC<Props> = ({ value, onChange }) => (
  <ToggleGroup
    type="single"
    value={value}
    onValueChange={(v) => {
      if (v) onChange(v as DisplayCurrency);
    }}
  >
    {DISPLAY_CURRENCIES.map((c) => (
      <ToggleGroupItem key={c} value={c} className="text-xs px-3 h-8">
        {c}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

export default BudgetDisplayCurrency;
