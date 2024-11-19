import cn from 'classnames';
import { Equal } from 'lucide-react';
import React, { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { CURRENCY_CODE } from '@/constants/currency';
import {
  useFinanceData,
  useFixerExchangeRates,
  useMonobankExchangeRates,
  useWiseExchangeRates,
} from '@/contexts/FinanceData';
import { getExchangeRate } from '@/utils/getExchangeRates';

interface RateComparisonProps {
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount?: number;
}

interface RateDisplayProps {
  value: number;
  source: 'fx' | 'mb' | 'ws';
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount: number;
  maximumFractionDigits: number;
}

export const ExchangeRatesPresets: React.FC = () => {
  const { toggleCurrencyConverter } = useFinanceData();
  const fixerRates = useFixerExchangeRates();
  const monoRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const RateComparison: React.FC<RateComparisonProps> = ({ from, to, amount = 1 }) => {
    const rate = useMemo(() => ({
      fixer: getExchangeRate(from, to, fixerRates),
      mono: getExchangeRate(from, to, monoRates),
      wise: getExchangeRate(from, to, wiseRates),
    }), [from, to, fixerRates, monoRates, wiseRates]);

    const averageRate = useMemo(() => {
      const validRates = Object.values(rate).filter(r => r !== null) as number[];
      return validRates.length > 0 ? validRates.reduce((a, b) => a + b, 0) / validRates.length : null;
    }, [rate]);

    const diff = averageRate !== null
      ? Object.entries(rate).reduce((acc, [source, value]) => {
        if (value !== null) {
          acc[source] = ((value - averageRate) / averageRate) * 100;
        }
        return acc;
      }, {} as Record<string, number>)
      : null;

    const maximumFractionDigits = [CURRENCY_CODE.BTC].includes(from) || [CURRENCY_CODE.HUF].includes(to) ? 0 : 2;

    const RateDisplay: React.FC<RateDisplayProps> = ({ value, source, from, to, amount, maximumFractionDigits }) => (
      <div className="flex items-center space-x-2 text-sm">
        <MoneyValue useColors={false} amount={amount} currency={from} />
        <Equal className="h-3 w-3 text-muted-foreground" />
        <div className="flex-1 flex items-start">
          <MoneyValue
            useColors={false}
            amount={amount * value}
            currency={to}
            maximumFractionDigits={maximumFractionDigits} />
          <sup className="ml-1 mt-2 text-[8px] font-medium text-muted-foreground">
            {source}
          </sup>
        </div>
        {diff && diff[source] !== undefined && (
          <span
            className={cn('text-[10px] font-medium', {
              'text-success': diff[source] >= 0,
              'text-destructive': diff[source] < 0,
            })}>
            {diff[source] >= 0 ? '+' : ''}{diff[source].toFixed(1)}%
          </span>
        )}
      </div>
    );

    return (
      <div className="bg-muted/20 p-2 rounded-md border border-muted relative">
        <h3 className="text-xs font-medium text-muted-foreground mb-1">
          {from} / {to}
        </h3>
        {rate.fixer !== null && (
          <RateDisplay
            value={rate.fixer}
            source="fx"
            from={from}
            to={to}
            amount={amount}
            maximumFractionDigits={maximumFractionDigits}
          />
        )}
        {rate.mono !== null && (
          <div className="mt-1 text-muted-foreground">
            <RateDisplay
              value={rate.mono}
              source="mb"
              from={from}
              to={to}
              amount={amount}
              maximumFractionDigits={maximumFractionDigits}
            />
          </div>
        )}
        {rate.wise !== null && (
          <div className="mt-1 text-muted-foreground">
            <RateDisplay
              value={rate.wise}
              source="ws"
              from={from}
              to={to}
              amount={amount}
              maximumFractionDigits={maximumFractionDigits}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 p-0 md:p-4">
      <div className="grid grid-cols-2 gap-3">
        <RateComparison from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.HUF} />
        <RateComparison from={CURRENCY_CODE.USD} to={CURRENCY_CODE.HUF} />
        <RateComparison from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.USD} />
        <RateComparison from={CURRENCY_CODE.HUF} to={CURRENCY_CODE.UAH} amount={1000} />
        <RateComparison from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.UAH} />
        <RateComparison from={CURRENCY_CODE.USD} to={CURRENCY_CODE.UAH} />
        <RateComparison from={CURRENCY_CODE.BTC} to={CURRENCY_CODE.EUR} />
        <RateComparison from={CURRENCY_CODE.BTC} to={CURRENCY_CODE.USD} />
      </div>

      <Button variant="outline" className="w-full" onClick={toggleCurrencyConverter}>
        Currency Converter
      </Button>
    </div>
  );
};

ExchangeRatesPresets.displayName = 'ExchangeRatesPresets';

export default ExchangeRatesPresets;
