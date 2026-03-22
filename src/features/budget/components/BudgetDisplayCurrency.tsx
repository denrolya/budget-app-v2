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
    aria-label="Display currency"
    type="single"
    value={value}
    onValueChange={(v) => {
      if (v) onChange(v as DisplayCurrency);
    }}
  >
    {DISPLAY_CURRENCIES.map((c) => (
      <ToggleGroupItem value={c} className="text-xs px-2 h-7" key={c}>
        {c}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

export default BudgetDisplayCurrency;
