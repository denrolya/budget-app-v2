import { Bitcoin, DollarSign, Euro } from 'lucide-react';
import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currencies = [
  { code: 'EUR', symbol: '€', icon: Euro },
  { code: 'USD', symbol: '$', icon: DollarSign },
  { code: 'HUF', symbol: 'Ft', icon: Bitcoin }, // Using Bitcoin icon as a placeholder for HUF
];

export const CurrencySelector = () => {
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  return (
    <Select
      value={selectedCurrency.code}
      onValueChange={(value) => setSelectedCurrency(currencies.find((c) => c.code === value) || currencies[0])}
    >
      <SelectTrigger className="w-[78px] text-xs border-none shadow-none bg-transparent hover:bg-transparent focus:ring-0 p-0 h-auto hover:text-accent-foreground transition-colors">
        <SelectValue>
          <div className="flex items-center">
            <selectedCurrency.icon className="mr-1 h-4 w-4" />
            <span className="font-medium">{selectedCurrency.code}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center">
              <currency.icon className="mr-2 h-4 w-4" />
              <span>{currency.code}</span>
              <span className="ml-auto text-muted-foreground">{currency.symbol}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
