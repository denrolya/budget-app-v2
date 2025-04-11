import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useAuth, useBaseCurrency } from '@/contexts/auth';
import { confirm } from '@/utils/confirmation';

type CurrencyType = {
  code: CURRENCY_CODE;
  name: string;
  symbol: string;
  type: 'fiat' | 'crypto';
  icon?: React.ComponentType<{ className?: string }>;
};

type SelectProps = React.ComponentPropsWithoutRef<typeof Select>;

type CurrencySelectorProps = Omit<SelectProps, 'value' | 'onValueChange'>;

export const HeaderCurrencySelector: React.FC<CurrencySelectorProps> = (props) => {
  const { updateCurrency } = useAuth();
  const baseCurrency = useBaseCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<CURRENCY_CODE>(
    baseCurrency || Object.values(CURRENCIES)[0].code,
  );

  const fiatCurrencies = useMemo(
    () => Object.values(CURRENCIES).filter((currency): currency is CurrencyType => currency.type === 'fiat'),
    [],
  );

  const handleCurrencyChange = async (value: CURRENCY_CODE) => {
    const confirmed = await confirm({
      title: 'Change Currency',
      description: `Are you sure you want to change your currency to ${value}?`,
      confirmText: value,
      cancelText: baseCurrency,
    });

    if (confirmed) {
      setSelectedCurrency(value);
      await updateCurrency(value);
      toast.success(`Currency updated to ${value}`);
    }
  };

  const renderCurrencyIcon = (currency: CurrencyType) => {
    if (currency.icon) {
      const IconComponent = currency.icon;
      return <IconComponent className="mr-1 h-4 w-4" />;
    }
    return <span className="mr-1 h-4 w-4">{currency.symbol}</span>;
  };

  return (
    <Select value={selectedCurrency} onValueChange={handleCurrencyChange} {...props}>
      <SelectTrigger className="w-[80px] text-xs border-none shadow-none bg-transparent hover:bg-transparent focus:ring-0 p-0 h-auto hover:text-accent-foreground transition-colors">
        <SelectValue>
          <div className="flex items-center">
            {renderCurrencyIcon(CURRENCIES[selectedCurrency] as CurrencyType)}
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

HeaderCurrencySelector.displayName = 'HeaderCurrencySelector';

export default HeaderCurrencySelector;
