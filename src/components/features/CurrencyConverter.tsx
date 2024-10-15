import { ArrowLeftRight, ArrowRightLeft } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFixerExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/contexts/FinanceData';

export const CurrencyConverter = () => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [amount, setAmount] = useState<number>(1);
  const [rateSource, setRateSource] = useState<'fxr' | 'mnb' | 'wse'>('fxr');

  const fixerRates = useFixerExchangeRates();
  const monoRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const rates = useMemo(() => {
    switch (rateSource) {
      case 'fxr': return fixerRates;
      case 'mnb': return monoRates;
      case 'wse': return wiseRates;
      default: return fixerRates;
    }
  }, [rateSource, fixerRates, monoRates, wiseRates]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const presetAmounts = [1, 5, 10, 50, 100, 500];

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (!rates[from] || !rates[to]) return 0;
    return rates[to] / rates[from];
  };

  const availableCurrencies = useMemo(() => Object.keys(rates).filter(currency => currency !== 'BTC' || rateSource === 'fxr'), [rates, rateSource]);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Currency Converter
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="space-y-1">
          <DrawerTitle>Currency Converter</DrawerTitle>
          <DrawerDescription>Convert between different currencies</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-3">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={rateSource === 'fxr' ? 'default' : 'outline'}
              onClick={() => setRateSource('fxr')}
            >
              FXR
            </Button>
            <Button
              size="sm"
              variant={rateSource === 'mnb' ? 'default' : 'outline'}
              onClick={() => setRateSource('mnb')}
            >
              MNB
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
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
              className="w-1/2 font-mono"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-1/4">
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={swapCurrencies}>
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-1/4">
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-2xl font-bold font-mono">
            {(amount * getExchangeRate(fromCurrency, toCurrency)).toFixed(2)} {toCurrency}
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
          <div className="text-xs text-muted-foreground font-mono">
            1 {fromCurrency} = {getExchangeRate(fromCurrency, toCurrency).toFixed(4)} {toCurrency}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

CurrencyConverter.displayName = 'CurrencyConverter';

export default CurrencyConverter;
