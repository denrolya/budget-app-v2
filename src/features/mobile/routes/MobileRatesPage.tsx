import React, { useState } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { useExchangeRates } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatMoney';

type Source = 'fixer' | 'mono' | 'wise';

const SOURCES: Source[] = ['fixer', 'mono', 'wise'];
const ALL_CURRENCIES = Object.keys(CURRENCIES) as CURRENCY_CODE[];

const MobileRatesPage: React.FC = () => {
  const baseCurrency = useBaseCurrency();
  const rates = useExchangeRates();
  const [source, setSource] = useState<Source>('fixer');

  const sourceRates = rates[source];
  const baseRate = sourceRates[baseCurrency] ?? 1;

  const displayCurrencies = ALL_CURRENCIES.filter((c) => c !== baseCurrency);

  return (
    <div className="pb-6">
      {/* Source selector */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-1.5">
        <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground mr-1">source</span>
        {SOURCES.map((s) => (
          <button
            type="button"
            className={cn(
              'h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors',
              source === s
                ? 'bg-muted text-foreground border-border'
                : 'text-muted-foreground border-transparent hover:border-border',
            )}
            key={s}
            onClick={() => setSource(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Base label */}
      <div className="px-3 py-2.5 flex items-baseline gap-2 border-b border-border/40">
        <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground">base</span>
        <span className="font-mono text-xs text-foreground">
          {CURRENCIES[baseCurrency].symbol} {baseCurrency} — {CURRENCIES[baseCurrency].name}
        </span>
      </div>

      {/* Rate rows */}
      {displayCurrencies.map((currency) => {
        const raw = sourceRates[currency];
        const curr = CURRENCIES[currency];

        if (!raw) {
          return (
            <div className="flex items-center justify-between px-3 py-3 border-b border-border/30" key={currency}>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-2xs uppercase tracking-wider text-muted-foreground w-8">
                  {currency}
                </span>
                <span className="text-xs text-muted-foreground/60">{curr.name}</span>
              </div>
              <span className="font-mono text-2xs text-muted-foreground/40">—</span>
            </div>
          );
        }

        // Units of `currency` per 1 unit of `baseCurrency`
        const rate = raw / baseRate;

        return (
          <div
            className="flex items-center justify-between px-3 py-3 border-b border-border/30 last:border-0"
            key={currency}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-2xs uppercase tracking-wider text-muted-foreground w-8">{currency}</span>
              <span className="text-xs text-muted-foreground">{curr.name}</span>
            </div>

            <div className="text-right">
              <p className="font-mono text-xs tabular-nums">
                {curr.symbol} {formatMoney(rate, currency)}
              </p>
              <p className="font-mono text-2xs text-muted-foreground">per 1 {CURRENCIES[baseCurrency].symbol}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileRatesPage;
