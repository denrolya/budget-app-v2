import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

const exchangeRateSources = {
  'Central Bank': {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 148.21, HUF: 354.50 },
    EUR: { USD: 1.09, GBP: 0.86, JPY: 161.10, HUF: 385.33 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.42 },
  },
  'Market Average': {
    USD: { EUR: 0.93, GBP: 0.80, JPY: 148.50, HUF: 355.00 },
    EUR: { USD: 1.08, GBP: 0.86, JPY: 160.80, HUF: 384.50 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.42 },
  },
  'Commercial Bank': {
    USD: { EUR: 0.91, GBP: 0.78, JPY: 147.90, HUF: 353.80 },
    EUR: { USD: 1.10, GBP: 0.85, JPY: 161.50, HUF: 386.00 },
    HUF: { USD: 0.0028, EUR: 0.0026, GBP: 0.0022, JPY: 0.41 },
  },
};

export const HeaderExchangeRatesDetails = () => {
  const [baseCurrency] = useState<string>('USD');
  const calculateStatistics = (from: string, to: string) => {
    const rates = Object.keys(exchangeRateSources).map((source) => getExchangeRate(source, from, to));
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const spread = max - min;
    return { avg, min, max, spread };
  };

  const getExchangeRate = (source: string, from: string, to: string): number => {
    if (from === to) return 1;
    return (
      exchangeRateSources[source as keyof typeof exchangeRateSources]
        [from as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]]
        [to as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources][keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]]]
      || 0
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="hidden md:flex items-center text-xs text-accent-foreground/80 space-x-2 cursor-pointer hover:text-accent-foreground transition-colors">
          <span className="font-mono">{baseCurrency}/EUR: {getExchangeRate('Central Bank', baseCurrency, 'EUR').toFixed(2)}</span>
          <span className="font-mono">{baseCurrency}/GBP: {getExchangeRate('Central Bank', baseCurrency, 'GBP').toFixed(2)}</span>
          <span className="font-mono">{baseCurrency}/JPY: {getExchangeRate('Central Bank', baseCurrency, 'JPY').toFixed(2)}</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Exchange Rates</SheetTitle>
          <SheetDescription>
            Current exchange rates and statistics
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          <div className="space-y-4">
            {Object.keys(exchangeRateSources).map((source) => (
              <div key={source} className="space-y-2">
                <h4 className="text-sm font-medium">{source}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>{baseCurrency}/EUR: {getExchangeRate(source, baseCurrency, 'EUR').toFixed(4)}</div>
                  <div>{baseCurrency}/GBP: {getExchangeRate(source, baseCurrency, 'GBP').toFixed(4)}</div>
                  <div>{baseCurrency}/JPY: {getExchangeRate(source, baseCurrency, 'JPY').toFixed(2)}</div>
                  <div>{baseCurrency}/HUF: {getExchangeRate(source, baseCurrency, 'HUF').toFixed(2)}</div>
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Statistics ({baseCurrency}/EUR)</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(calculateStatistics(baseCurrency, 'EUR')).map(([key, value]) => (
                  <div key={key}>{key}: {value.toFixed(4)}</div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
