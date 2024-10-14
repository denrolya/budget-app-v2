import React, { useMemo, useState } from 'react';

import { CURRENCY_CODE, CURRENCIES } from '@/constants/currency';
import { useAuth, useBaseCurrency } from '@/contexts/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CurrencySelector: React.FC = () => {
  const { updateCurrency } = useAuth();
  const baseCurrency = useBaseCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<CURRENCY_CODE>(baseCurrency || Object.values(CURRENCIES)[0].code);

  const fiatCurrencies = useMemo(() => Object.values(CURRENCIES).filter(currency => currency.type === 'fiat'), []);


  const handleCurrencyChange = (value: CURRENCY_CODE) => {
    setSelectedCurrency(value);
    updateCurrency(value);
  };

  const renderCurrencyIcon = (currency: typeof CURRENCIES[CURRENCY_CODE]) => {
    if (currency.icon) {
      const IconComponent = currency.icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="mr-1 h-4 w-4" />;
    }
    return <span className="mr-1 h-4 w-4">{currency.symbol}</span>;
  };

  return (
    <Select
      value={selectedCurrency}
      onValueChange={handleCurrencyChange}
    >
      <SelectTrigger className="w-[100px] text-xs border-none shadow-none bg-transparent hover:bg-transparent focus:ring-0 p-0 h-auto hover:text-accent-foreground transition-colors">
        <SelectValue>
          <div className="flex items-center">
            {renderCurrencyIcon(CURRENCIES[selectedCurrency])}
            <span className="font-medium">{selectedCurrency}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {fiatCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center">
              {renderCurrencyIcon(currency)}
              <span>{currency.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
