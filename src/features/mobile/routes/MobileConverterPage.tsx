import { ArrowLeftRight } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useExchangeRates } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatMoney';

type Source = 'fixer' | 'mono' | 'wise';

const SOURCES: Source[] = ['fixer', 'mono', 'wise'];
const ALL_CURRENCIES = Object.keys(CURRENCIES) as CURRENCY_CODE[];

// ── Currency row buttons ────────────────────────────────────────────────────

interface CurrencyRowProps {
  label: string;
  value: CURRENCY_CODE;
  onChange: (v: CURRENCY_CODE) => void;
}

const CurrencyRow: React.FC<CurrencyRowProps> = ({ label, value, onChange }) => (
  <div>
    <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
    <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {ALL_CURRENCIES.map((c) => (
        <button
          type="button"
          className={cn(
            'h-8 px-3 rounded border font-mono text-xs shrink-0 transition-colors flex items-center gap-1.5',
            value === c
              ? 'bg-muted text-foreground border-border'
              : 'text-muted-foreground border-transparent hover:border-border',
          )}
          key={c}
          onClick={() => onChange(c)}
        >
          <span className="font-semibold">{c}</span>
          <span className="text-muted-foreground">{CURRENCIES[c].symbol}</span>
        </button>
      ))}
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const MobileConverterPage: React.FC = () => {
  const baseCurrency = useBaseCurrency();
  const rates = useExchangeRates();

  const [source, setSource] = useState<Source>('fixer');
  const [from, setFrom] = useState<CURRENCY_CODE>(baseCurrency);
  const [to, setTo] = useState<CURRENCY_CODE>(
    CURRENCY_CODE.USD === baseCurrency ? CURRENCY_CODE.EUR : CURRENCY_CODE.USD,
  );
  const [amount, setAmount] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus amount on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const sourceRates = rates[source];

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num === 0) return null;
    const fromRate = sourceRates[from] ?? 1;
    const toRate = sourceRates[to] ?? 1;
    return num * (toRate / fromRate);
  }, [amount, from, to, sourceRates]);

  const unitRate = useMemo(() => {
    const fromRate = sourceRates[from] ?? 1;
    const toRate = sourceRates[to] ?? 1;
    return toRate / fromRate;
  }, [from, to, sourceRates]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  // All rates relative to `from` currency
  const relativeRates = useMemo(
    () => {
      const fromRate = sourceRates[from] ?? 1;
      return ALL_CURRENCIES.filter((c) => c !== from).map((c) => {
        const raw = sourceRates[c];
        return { currency: c, rate: raw != null ? raw / fromRate : null };
      });
    },
    [from, sourceRates],
  );

  return (
    <div className="pb-6">
      {/* Source selector */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mr-1">source</span>
        {SOURCES.map((s) => (
          <button
            type="button"
            className={cn(
              'h-7 px-2.5 rounded border font-mono text-xs uppercase tracking-wider transition-colors',
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

      {/* Converter */}
      <div className="px-4 pt-4 pb-5 flex flex-col gap-4 border-b border-border">
        {/* From currency + amount */}
        <div>
          <CurrencyRow label="from" value={from} onChange={setFrom} />
          <input
            ref={inputRef}
            aria-label="Amount"
            inputMode="decimal"
            placeholder="0"
            type="number"
            value={amount}
            className="mt-2 w-full h-12 rounded-md border border-border bg-background font-mono text-xl px-3 tabular-nums text-right text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Swap */}
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-border" />
          <button
            aria-label="Swap currencies"
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={handleSwap}
          >
            <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="flex-1 h-px bg-border" />
        </div>

        {/* To currency */}
        <CurrencyRow label="to" value={to} onChange={setTo} />

        {/* Result */}
        <div className="rounded-md border border-border bg-muted/20 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">result</p>

          {result !== null ? (
            <>
              <p className="font-mono text-3xl tabular-nums font-semibold leading-none">
                {CURRENCIES[to].symbol} {formatMoney(result, to)}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1.5 tabular-nums">
                1 {from} = {CURRENCIES[to].symbol} {formatMoney(unitRate, to)} {to}
              </p>
            </>
          ) : (
            <p className="font-mono text-2xl text-muted-foreground/40">—</p>
          )}
        </div>
      </div>

      {/* All rates relative to `from` */}
      <div>
        <div className="px-3 py-2 flex items-baseline gap-2 border-b border-border/40">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">all rates</span>
          <span className="font-mono text-xs text-muted-foreground/60">per 1 {CURRENCIES[from].symbol}</span>
        </div>

        {relativeRates.map(({ currency, rate }) => {
          const curr = CURRENCIES[currency];

          if (rate == null) {
            return (
              <div
                className="flex items-center justify-between px-3 py-3 border-b border-border/30"
                key={currency}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-8">
                    {currency}
                  </span>
                  <span className="text-sm text-muted-foreground/60">{curr.name}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground/40">—</span>
              </div>
            );
          }

          return (
            <div
              className="flex items-center justify-between px-3 py-3 border-b border-border/30 last:border-0"
              key={currency}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-8">
                  {currency}
                </span>
                <span className="text-sm text-muted-foreground">{curr.name}</span>
              </div>
              <p className="font-mono text-sm tabular-nums">
                {curr.symbol} {formatMoney(rate, currency)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileConverterPage;
