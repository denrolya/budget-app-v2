import { ArrowLeftRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_CODE } from '@/constants/currency';
import { useFixerExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/contexts/FinanceData';

interface Props {
  defaultFromCurrency?: CURRENCY_CODE;
  defaultToCurrency?: CURRENCY_CODE;
  defaultAmount?: number;
}

export const CurrencyConverter: React.FC<Props> = ({
                                                     defaultFromCurrency = CURRENCY_CODE.HUF,
                                                     defaultToCurrency = CURRENCY_CODE.EUR,
                                                     defaultAmount = 1000,
                                                   }) => {
  const [fromCurrency, setFromCurrency] = useState<CURRENCY_CODE>(defaultFromCurrency);
  const [toCurrency, setToCurrency] = useState<CURRENCY_CODE>(defaultToCurrency);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [rateSource, setRateSource] = useState<'mnb' | 'fx' | 'wse'>('mnb');

  const fixerRates = useFixerExchangeRates();
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

  const presetAmounts = [1, 5, 10, 50, 100, 500, 1000];

  const getExchangeRate = (from: CURRENCY_CODE, to: CURRENCY_CODE): number => {
    if (from === to) return 1;
    if (!rates[from] || !rates[to]) return 0;
    return rates[to] / rates[from];
  };

  const availableCurrencies = useMemo(() =>
      Object.keys(rates).filter(currency => currency !== CURRENCY_CODE.BTC || rateSource === 'fx') as CURRENCY_CODE[],
    [rates, rateSource],
  );

  const convertedAmount = (amount * getExchangeRate(fromCurrency, toCurrency)).toFixed(2);

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant={rateSource === 'mnb' ? 'default' : 'outline'}
          onClick={() => setRateSource('mnb')}
        >
          MNB
        </Button>
        <Button
          size="sm"
          variant={rateSource === 'fx' ? 'default' : 'outline'}
          onClick={() => setRateSource('fx')}
        >
          FX
        </Button>
        <Button
          size="sm"
          variant={rateSource === 'wse' ? 'default' : 'outline'}
          onClick={() => setRateSource('wse')}
        >
          WSE
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
              className="w-full pr-20 font-mono text-lg"
            />
            <Select value={fromCurrency} onValueChange={(value) => setFromCurrency(value as CURRENCY_CODE)}>
              <SelectTrigger className="absolute inset-y-0 right-0 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={swapCurrencies}>
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="relative">
            <Input
              type="number"
              value={convertedAmount}
              readOnly
              className="w-full pr-20 font-mono text-lg"
            />
            <Select value={toCurrency} onValueChange={(value) => setToCurrency(value as CURRENCY_CODE)}>
              <SelectTrigger className="absolute inset-y-0 right-0 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {amount} {fromCurrency} = {convertedAmount} {toCurrency}
      </div>
      <div className="text-xs text-muted-foreground">
        1 {fromCurrency} = {getExchangeRate(fromCurrency, toCurrency).toFixed(4)} {toCurrency}
      </div>
      <div className="flex flex-wrap gap-2">
        {presetAmounts.map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => setAmount(preset)}
            className="font-mono"
          >
            {preset}
          </Button>
        ))}
      </div>
    </div>
  );
};

CurrencyConverter.displayName = 'CurrencyConverter';

export default CurrencyConverter;
