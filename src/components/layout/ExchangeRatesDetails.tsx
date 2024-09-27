import React from 'react';
import { ChevronRight } from 'lucide-react';

import { CURRENCY_CODE } from '@/constants/currency';
import MoneyValue from '@/components/common/MoneyValue';
import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useFixerExchangeRates } from '@/contexts/FinanceData';
import { getExchangeRate } from '@/utils/getExchangeRates';

export const ExchangeRatesDetails: React.FC = () => {
  const fixerExchangeRates = useFixerExchangeRates();

  const headerCurrencyPairs = [
    { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.USD },
    { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.HUF },
    { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.UAH },
    { from: CURRENCY_CODE.USD, to: CURRENCY_CODE.UAH },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="hidden md:flex items-center text-xs text-accent-foreground/80 space-x-2 cursor-pointer hover:text-accent-foreground transition-colors">
          {headerCurrencyPairs.map(({ from, to }) => (
            <span key={`${from}/${to}`} className="font-mono">
              {from}/{to}: <MoneyValue showSymbol={false} amount={getExchangeRate(from, to, fixerExchangeRates) ?? 0} />
            </span>
          ))}
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4">
          <SheetTitle className="text-lg font-semibold text-primary">Exchange Rates</SheetTitle>
          <SheetDescription className="text-xs">
            Current rates for major currencies
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          <ExchangeRatesPresets />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ExchangeRatesDetails;
