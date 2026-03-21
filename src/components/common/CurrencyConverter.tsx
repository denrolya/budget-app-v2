import { ArrowUpDown } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CURRENCY_DISPLAY_ORDER, CURRENCY_CODE } from '@/constants/currency';
import { useExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

type RATE_SOURCE = 'mnb' | 'fx' | 'wse';

const rateSources: RATE_SOURCE[] = ['mnb', 'wse', 'fx'];
const presetAmounts = [10, 50, 100, 500, 1000, 5000, 10000];

interface Props {
  defaultFromCurrency?: CURRENCY_CODE;
  defaultToCurrency?: CURRENCY_CODE;
  defaultAmount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const chip = (active: boolean, disabled = false) =>
  cn(
    'h-6 px-2.5 rounded border font-mono text-2xs uppercase tracking-wider transition-colors cursor-pointer select-none',
    {
      'bg-muted text-foreground border-border': active,
      'text-muted-foreground border-transparent hover:border-border': !active && !disabled,
      'text-muted-foreground/40 border-transparent pointer-events-none': disabled,
    },
  );

export const CurrencyConverter: React.FC<Props> = ({
  defaultFromCurrency = CURRENCY_CODE.HUF,
  defaultToCurrency = CURRENCY_CODE.EUR,
  defaultAmount = 1000,
  open,
  onOpenChange,
}) => {
  const [fromCurrency, setFromCurrency] = useState<CURRENCY_CODE>(defaultFromCurrency);
  const [toCurrency, setToCurrency] = useState<CURRENCY_CODE>(defaultToCurrency);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [rateSource, setRateSource] = useState<RATE_SOURCE>('mnb');

  const fixerRates = useExchangeRates().fixer;
  const monoRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const rates = useMemo(() => {
    switch (rateSource) {
      case 'fx':
        return fixerRates;
      case 'mnb':
        return monoRates;
      case 'wse':
        return wiseRates;
      default:
        return wiseRates;
    }
  }, [rateSource, fixerRates, monoRates, wiseRates]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getExchangeRate = (from: CURRENCY_CODE, to: CURRENCY_CODE): number => {
    if (from === to) return 1;
    if (!rates[from] || !rates[to]) return 0;
    return rates[to] / rates[from];
  };

  useEffect(() => {
    setAmount((prev) => Math.min(Math.max(prev, 0), 10_000));
  }, [fromCurrency, toCurrency]);

  const availableCurrencies = useMemo(
    () =>
      (Object.keys(rates).filter((c) => c !== CURRENCY_CODE.BTC || rateSource === 'fx') as CURRENCY_CODE[]).sort(
        (a, b) => {
          const ai = CURRENCY_DISPLAY_ORDER.indexOf(a);
          const bi = CURRENCY_DISPLAY_ORDER.indexOf(b);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        },
      ),
    [rates, rateSource],
  );

  const convertedAmount = (amount * getExchangeRate(fromCurrency, toCurrency)).toFixed(2);
  const rate = getExchangeRate(fromCurrency, toCurrency).toFixed(4);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value === '' ? 0 : Number(value));
    }
  };

  const handleFromSelect = (c: CURRENCY_CODE) => {
    if (c === toCurrency) swapCurrencies();
    else setFromCurrency(c);
  };

  const handleToSelect = (c: CURRENCY_CODE) => {
    if (c === fromCurrency) swapCurrencies();
    else setToCurrency(c);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-5 gap-0">
        <DialogTitle className="sr-only">Currency Converter</DialogTitle>
        <DialogDescription className="sr-only">Convert between currencies using live exchange rates</DialogDescription>

        {/* Top bar: rate source chips + pair label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {rateSources.map((source) => (
              <button key={source} className={chip(rateSource === source)} type="button" onClick={() => setRateSource(source)}>
                {source}
              </button>
            ))}
          </div>
          <span className="font-mono text-2xs text-muted-foreground tracking-widest">
            {fromCurrency} / {toCurrency}
          </span>
        </div>

        {/* FROM block */}
        <div className="space-y-1">
          <Input
            autoFocus
            inputMode="decimal"
            type="text"
            value={amount}
            className="h-10 font-mono text-base tabular-nums rounded-lg"
            onChange={handleAmountChange}
          />
          <div className="flex flex-wrap gap-1">
            {availableCurrencies.map((c) => (
              <button key={c} className={chip(c === fromCurrency, c === toCurrency)} type="button" onClick={() => handleFromSelect(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Swap */}
        <div className="flex justify-center py-2">
          <button
            aria-label="Swap currencies"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            type="button"
            onClick={swapCurrencies}
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>
        </div>

        {/* TO block */}
        <div className="space-y-1">
          <Input
            readOnly
            type="text"
            value={convertedAmount}
            className="h-10 font-mono text-base tabular-nums rounded-lg bg-muted/30 text-muted-foreground"
          />
          <div className="flex flex-wrap gap-1">
            {availableCurrencies.map((c) => (
              <button key={c} className={chip(c === toCurrency, c === fromCurrency)} type="button" onClick={() => handleToSelect(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Rate ticker */}
        <p className="mt-4 font-mono text-2xs tracking-wide text-muted-foreground">
          1 {fromCurrency} = {rate} {toCurrency} · {rateSource.toUpperCase()}
        </p>

        {/* Preset chips */}
        <div className="mt-2 flex flex-wrap gap-1">
          {presetAmounts.map((preset) => (
            <button key={preset} className={chip(amount === preset)} type="button" onClick={() => setAmount(preset)}>
              {preset >= 1000 ? `${preset / 1000}k` : preset}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

CurrencyConverter.displayName = 'CurrencyConverter';

export default CurrencyConverter;
