import { Check } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { useAuth, useBaseCurrency } from '@/features/auth';
import { confirm } from '@/lib/confirmation';

const CurrencySelector: React.FC = () => {
  const { updateCurrency } = useAuth();
  const baseCurrency = useBaseCurrency();

  const fiatCurrencies = React.useMemo(
    () => Object.values(CURRENCIES).filter((c) => c.type === 'fiat'),
    [],
  );

  const handleCurrencyChange = async (code: CURRENCY_CODE) => {
    if (code === baseCurrency) return;
    const confirmed = await confirm({
      title: 'Change Currency',
      description: `Change base currency to ${code}?`,
      confirmText: code,
      cancelText: baseCurrency ?? 'Cancel',
    });
    if (!confirmed) return;
    await updateCurrency(code);
    toast.success(`Base currency updated to ${code}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-7 px-2 inline-flex items-center rounded font-mono text-2xs font-semibold tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-transparent hover:border-border/40 select-none"
          title="Base currency"
        >
          {baseCurrency}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" sideOffset={4} className="min-w-36">
        <DropdownMenuLabel className="text-2xs text-muted-foreground">Base currency</DropdownMenuLabel>
        {fiatCurrencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code as CURRENCY_CODE)}
          >
            <span className="w-5 text-center mr-2 text-sm leading-none">{currency.symbol}</span>
            <span className="flex-1 font-mono text-xs">{currency.code}</span>
            {baseCurrency === currency.code && <Check className="ml-2 h-3 w-3 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
