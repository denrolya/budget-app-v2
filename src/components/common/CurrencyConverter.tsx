import { ArrowUpDown } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_CODE } from '@/constants/currency';
import { useExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/hooks/financeData';

type RATE_SOURCE = 'mnb' | 'fx' | 'wse';

const rateSources: RATE_SOURCE[] = ['mnb', 'wse', 'fx'];
const presetAmounts = [10, 50, 100, 500, 1000, 5000, 10000];

const CurrencyFlag = ({ code }: { code: CURRENCY_CODE }) => {
  const flagEmoji = {
    [CURRENCY_CODE.USD]: '🇺🇸',
    [CURRENCY_CODE.EUR]: '🇪🇺',
    [CURRENCY_CODE.HUF]: '🇭🇺',
    [CURRENCY_CODE.UAH]: '🇺🇦',
    [CURRENCY_CODE.BTC]: '₿',
    [CURRENCY_CODE.ETH]: 'Ξ',
  }[code];

  return <span className="mr-2">{flagEmoji}</span>;
};

interface Props {
  defaultFromCurrency?: CURRENCY_CODE;
  defaultToCurrency?: CURRENCY_CODE;
  defaultAmount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    setAmount((prevAmount) => Math.min(Math.max(prevAmount, 0), 10000));
  }, [fromCurrency, toCurrency]);

  const availableCurrencies = useMemo(
    () =>
      Object.keys(rates).filter((currency) => currency !== CURRENCY_CODE.BTC || rateSource === 'fx') as CURRENCY_CODE[],
    [rates, rateSource],
  );

  const convertedAmount = (amount * getExchangeRate(fromCurrency, toCurrency)).toFixed(2);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value === '' ? 0 : Number(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-4">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-2xl font-bold">Currency Converter</DialogTitle>
          <DialogDescription>Convert between currencies using the latest exchange rates</DialogDescription>
        </DialogHeader>
        <div className="flex space-x-1 mb-4">
          {rateSources.map((source) => (
            <Button
              size="sm"
              variant={rateSource === source ? 'default' : 'outline'}
              key={source}
              onClick={() => setRateSource(source)}
            >
              {source}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <div className="relative">
            <Input
              autoFocus
              inputMode="decimal"
              type="text"
              value={amount}
              className="pr-20 text-2xl font-semibold h-16 rounded-xl"
              onChange={handleAmountChange}
            />
            <Select value={fromCurrency} onValueChange={(value) => setFromCurrency(value as CURRENCY_CODE)}>
              <SelectTrigger className="absolute inset-y-0 right-0 w-30 h-full rounded-r-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem value={currency} key={currency}>
                    <CurrencyFlag code={currency} />
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center">
            <Button
              aria-label="Swap currencies"
              size="icon"
              variant="ghost"
              className="rounded-full bg-muted"
              onClick={swapCurrencies}
            >
              <ArrowUpDown className="h-6 w-6" />
            </Button>
          </div>
          <div className="relative">
            <Input
              readOnly
              type="text"
              value={convertedAmount}
              className="pr-20 text-2xl font-semibold h-16 rounded-xl"
            />
            <Select value={toCurrency} onValueChange={(value) => setToCurrency(value as CURRENCY_CODE)}>
              <SelectTrigger className="absolute inset-y-0 right-0 w-30 h-full rounded-r-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem value={currency} key={currency}>
                    <CurrencyFlag code={currency} />
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {amount} {fromCurrency} = {convertedAmount} {toCurrency}
        </div>
        <div className="text-xs text-muted-foreground">
          1 {fromCurrency} = {getExchangeRate(fromCurrency, toCurrency).toFixed(4)} {toCurrency}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {presetAmounts.map((preset) => (
            <Button size="sm" variant="outline" className="flex-grow" key={preset} onClick={() => setAmount(preset)}>
              {preset}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

CurrencyConverter.displayName = 'CurrencyConverter';

export default CurrencyConverter;
