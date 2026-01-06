import React from 'react';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import MoneyValue from '@/components/common/MoneyValue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CURRENCY_CODE } from '@/constants/currency';
import { useFixerExchangeRates } from '@/contexts/FinanceData';
import { getExchangeRate } from '@/lib/getExchangeRates';

export const ExchangeRatesDetails: React.FC = () => {
  const fixerExchangeRates = useFixerExchangeRates();

  const headerCurrencyPairs = [
    { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.USD },
    { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.HUF },
    { from: CURRENCY_CODE.USD, to: CURRENCY_CODE.HUF },
    { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.UAH },
    { from: CURRENCY_CODE.USD, to: CURRENCY_CODE.UAH },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="hidden md:flex items-center text-xs space-x-2">
          {headerCurrencyPairs.map(({ from, to }) => (
            <div
              className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              key={`${from}/${to}`}>
              <span className="antialiased">
                {from}/{to}
              </span>
              <MoneyValue
                useColors={false}
                showSymbol={false}
                className="font-semibold"
                amount={getExchangeRate(from, to, fixerExchangeRates) ?? 0}
                currency={to}
              />
            </div>
          ))}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4">
          <SheetTitle className="text-lg font-semibold text-primary">Exchange Rates</SheetTitle>
          <SheetDescription className="text-xs">Current rates for major currencies</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          <ExchangeRatesPresets />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ExchangeRatesDetails;
