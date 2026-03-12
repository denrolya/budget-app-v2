import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { useAuth, useBaseCurrency } from '@/features/auth';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

type CurrencyType = {
  code: CURRENCY_CODE;
  name: string;
  symbol: string;
  type: 'fiat' | 'crypto';
  icon?: React.ComponentType<{ className?: string }>;
  color: string;
};

interface CurrencyButtonSelectorProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
}

const CurrencyButtonSelector: React.FC<CurrencyButtonSelectorProps> = ({ className, ...props }) => {
  const { updateCurrency } = useAuth();
  const baseCurrency = useBaseCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<CURRENCY_CODE>(
    baseCurrency || Object.values(CURRENCIES)[0].code,
  );

  const fiatCurrencies = useMemo(
    () =>
      Object.entries(CURRENCIES).filter(([_, currency]) => currency.type === 'fiat') as [CURRENCY_CODE, CurrencyType][],
    [],
  );

  const handleCurrencyChange = async (value: CURRENCY_CODE) => {
    if (value === selectedCurrency) return;

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

  return (
    <div className={cn('space-y-4 w-full', className)} {...props}>
      <div className="flex w-full justify-between space-x-2">
        {fiatCurrencies.map(([code, info]) => (
          <Button
            type="button"
            variant="outline"
            className={cn(
              'flex-1 h-16 px-2 py-1 text-sm font-medium rounded-md transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              {
                'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground':
                  selectedCurrency === code,
                'bg-background text-foreground hover:bg-accent hover:text-accent-foreground': selectedCurrency !== code,
              },
            )}
            key={code}
            onClick={() => handleCurrencyChange(code)}
          >
            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-2xl">{info.symbol}</span>
              <span className="text-xs">{code.toUpperCase()}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CurrencyButtonSelector;
