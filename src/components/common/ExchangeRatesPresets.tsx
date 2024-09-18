import { ArrowRightLeft } from 'lucide-react';
import React from 'react';

import { useExchangeRates } from '@/contexts/FinanceData';

export const ExchangeRatesPresets: React.FC = () => {
  const exchangeRates = useExchangeRates();

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (from === 'EUR') return exchangeRates[to];
    if (to === 'EUR') return 1 / exchangeRates[from];
    return exchangeRates[to] / exchangeRates[from];
  };

  const formatRate = (from: string, to: string, amount: number = 1): string => {
    const rate = getExchangeRate(from, to);
    return `${amount} ${from} = ${(amount * rate).toFixed(to === 'BTC' ? 8 : 2)} ${to}`;
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="bg-muted/20 p-2 rounded-md border border-muted">
        <h3 className="flex items-center justify-between text-xs font-medium mb-1 text-muted-foreground">
          EUR / USD
          <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
        </h3>
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div>{formatRate('EUR', 'USD')}</div>
          <div className="text-right">{formatRate('USD', 'EUR')}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/20 p-2 rounded-md border border-muted">
          <h3 className="text-xs font-medium mb-1 text-muted-foreground">EUR / HUF</h3>
          <div className="font-mono">{formatRate('EUR', 'HUF')}</div>
        </div>
        <div className="bg-muted/20 p-2 rounded-md border border-muted">
          <h3 className="text-xs font-medium mb-1 text-muted-foreground">USD / HUF</h3>
          <div className="font-mono">{formatRate('USD', 'HUF')}</div>
        </div>
        <div className="bg-muted/20 p-2 rounded-md border border-muted">
          <h3 className="text-xs font-medium mb-1 text-muted-foreground">EUR / UAH</h3>
          <div className="font-mono">{formatRate('EUR', 'UAH')}</div>
        </div>
        <div className="bg-muted/20 p-2 rounded-md border border-muted">
          <h3 className="text-xs font-medium mb-1 text-muted-foreground">1000 HUF / UAH</h3>
          <div className="font-mono">{formatRate('HUF', 'UAH', 1000)}</div>
        </div>
      </div>

      <div className="bg-muted/20 p-2 rounded-md border border-muted">
        <h3 className="flex items-center justify-between text-xs font-medium mb-1 text-muted-foreground">
          <span>BTC / EUR</span>
          <span>BTC / USD</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-mono">{formatRate('BTC', 'EUR')}</div>
          <div className="font-mono">{formatRate('BTC', 'USD')}</div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRatesPresets;
