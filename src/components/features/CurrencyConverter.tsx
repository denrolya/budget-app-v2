import { ArrowLeftRight, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';

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

export const CurrencyConverter = () => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [amount, setAmount] = useState<number>(1);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const presetAmounts = [1, 5, 10, 50, 100, 500];

  const getExchangeRate = (source: string, from: string, to: string): number => {
    if (from === to) return 1;
    return (
      exchangeRateSources
        [source as keyof typeof exchangeRateSources]
        [from as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]]
        [to as keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources][keyof (typeof exchangeRateSources)[keyof typeof exchangeRateSources]]]
      || 0
    );
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Currency Converter
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Currency Converter</DrawerTitle>
          <DrawerDescription>Convert between different currencies</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
                className="w-full font-mono"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="HUF">HUF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-full text-2xl font-bold font-mono">
                {(amount * getExchangeRate('Central Bank', fromCurrency, toCurrency)).toFixed(2)}
              </div>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="HUF">HUF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={swapCurrencies} className="w-full">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Swap Currencies
          </Button><Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Currency Converter
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Currency Converter</DrawerTitle>
              <DrawerDescription>Convert between different currencies</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
                    className="w-full font-mono"
                  />
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="HUF">HUF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-full text-2xl font-bold font-mono">
                    {(amount * getExchangeRate('Central Bank', fromCurrency, toCurrency)).toFixed(2)}
                  </div>
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="HUF">HUF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={swapCurrencies} className="w-full">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Swap Currencies
              </Button>
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
                1 {fromCurrency} = {getExchangeRate('Central Bank', fromCurrency, toCurrency).toFixed(4)} {toCurrency}
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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
            1 {fromCurrency} = {getExchangeRate('Central Bank', fromCurrency, toCurrency).toFixed(4)} {toCurrency}
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
