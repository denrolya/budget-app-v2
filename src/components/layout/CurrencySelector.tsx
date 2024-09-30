import React, { useState } from 'react';

import { CURRENCY_CODE } from '@/constants/currency';
import { useAuth, useBaseCurrency } from '@/contexts/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currencies = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'HUF', symbol: 'Ft' },
];

export const CurrencySelector:React.FC = () => {
  const { updateCurrency } = useAuth();
  const baseCurrency = useBaseCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency || currencies[0].code);

  const handleCurrencyChange = (value: CURRENCY_CODE) => {
    setSelectedCurrency(value);
    updateCurrency(value);
  };

  return (
    <Select
      value={selectedCurrency}
      onValueChange={handleCurrencyChange}
    >
      <SelectTrigger className="w-[78px] text-xs border-none shadow-none bg-transparent hover:bg-transparent focus:ring-0 p-0 h-auto hover:text-accent-foreground transition-colors">
        <SelectValue>
          <div className="flex items-center">
            <span className="mr-1 h-4 w-4">{currencies.find(c => c.code === selectedCurrency)?.symbol}</span>
            <span className="font-medium">{selectedCurrency}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center">
              <span className="mr-2 h-4 w-4">{currency.symbol}</span>
              <span>{currency.code}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
