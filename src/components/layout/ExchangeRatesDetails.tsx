import { ChevronRight } from 'lucide-react';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useExchangeRates } from '@/contexts/FinanceData';

export const ExchangeRatesDetails = () => {
  const exchangeRates = useExchangeRates();

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (from === 'EUR') return exchangeRates[to];
    if (to === 'EUR') return 1 / exchangeRates[from];
    return exchangeRates[to] / exchangeRates[from];
  };

  const headerCurrencyPairs = [
    { from: 'EUR', to: 'USD' },
    { from: 'EUR', to: 'HUF' },
    { from: 'EUR', to: 'UAH' },
    { from: 'USD', to: 'UAH' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="hidden md:flex items-center text-xs text-accent-foreground/80 space-x-2 cursor-pointer hover:text-accent-foreground transition-colors">
          {headerCurrencyPairs.map(({ from, to }) => (
            <span key={`${from}/${to}`} className="font-mono">
              {from}/{to}: {getExchangeRate(from, to).toFixed(2)}
            </span>
          ))}
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
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
