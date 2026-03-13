import { ArrowLeftRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useExchangeRates } from '@/hooks/financeData';
import { formatMoney } from '@/lib/formatMoney';

const ALL_CURRENCIES = Object.keys(CURRENCIES) as CURRENCY_CODE[];

const CurrencySelect: React.FC<{
  label: string;
  value: CURRENCY_CODE;
  onChange: (v: CURRENCY_CODE) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block font-mono text-2xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
    <select
      aria-label={label}
      value={value}
      className="h-9 w-full rounded-md border border-border bg-background font-mono text-sm px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      onChange={(e) => onChange(e.target.value as CURRENCY_CODE)}
    >
      {ALL_CURRENCIES.map((c) => (
        <option value={c} key={c}>
          {c} — {CURRENCIES[c].symbol} {CURRENCIES[c].name}
        </option>
      ))}
    </select>
  </div>
);

const MobileConverterPage: React.FC = () => {
  const baseCurrency = useBaseCurrency();
  const rates = useExchangeRates();

  const [from, setFrom] = useState<CURRENCY_CODE>(baseCurrency);
  const [to, setTo] = useState<CURRENCY_CODE>(
    CURRENCY_CODE.USD === baseCurrency ? CURRENCY_CODE.EUR : CURRENCY_CODE.USD,
  );
  const [amount, setAmount] = useState('1');

  const sourceRates = rates.fixer;

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

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      <p className="font-mono text-2xs uppercase tracking-widest text-muted-foreground">currency converter</p>

      {/* From currency + amount */}
      <div>
        <CurrencySelect label="from" value={from} onChange={setFrom} />
        <input
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
          className="h-7 w-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={handleSwap}
        >
          <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <span className="flex-1 h-px bg-border" />
      </div>

      {/* To currency */}
      <CurrencySelect label="to" value={to} onChange={setTo} />

      {/* Result panel */}
      <div className="rounded-md border border-border bg-muted/20 px-4 py-4">
        <p className="font-mono text-2xs uppercase tracking-widest text-muted-foreground mb-2">result</p>

        {result !== null ? (
          <>
            <p className="font-mono text-3xl tabular-nums font-semibold leading-none">
              {CURRENCIES[to].symbol} {formatMoney(result, to)}
            </p>
            <p className="font-mono text-2xs text-muted-foreground mt-2 tabular-nums">
              1 {from} = {CURRENCIES[to].symbol} {formatMoney(unitRate, to)} {to}
            </p>
          </>
        ) : (
          <p className="font-mono text-2xl text-muted-foreground/40">—</p>
        )}
      </div>

      <p className="font-mono text-2xs text-muted-foreground/50 text-center">rates via fixer · 1h cache</p>
    </div>
  );
};

export default MobileConverterPage;
