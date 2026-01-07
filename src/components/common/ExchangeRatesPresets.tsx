import cn from 'classnames';
import { Equal } from 'lucide-react';
import React, { useMemo } from 'react';

import { useCurrencyConverter } from '@/contexts/CurrencyConverter';
import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { CURRENCY_CODE } from '@/constants/currency';
import {
  useFixerExchangeRates,
  useMonobankExchangeRates,
  useWiseExchangeRates,
} from '@/hooks/financeData';
import { getExchangeRate } from '@/lib/getExchangeRates';

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
  const { toggle: toggleCurrencyConverter } = useCurrencyConverter();
  const fixerRates = useFixerExchangeRates();
  const monoRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const RateComparison: React.FC<RateComparisonProps> = ({ from, to, amount = 1 }) => {
    const rate = useMemo(
      () => ({
        fixer: getExchangeRate(from, to, fixerRates),
        mono: getExchangeRate(from, to, monoRates),
        wise: getExchangeRate(from, to, wiseRates),
      }),
      [from, to, fixerRates, monoRates, wiseRates],
    );

    const averageRate = useMemo(() => {
      const validRates = Object.values(rate).filter((r) => r !== null) as number[];
      return validRates.length > 0 ? validRates.reduce((a, b) => a + b, 0) / validRates.length : null;
    }, [rate]);

    const diff =
      averageRate !== null
        ? Object.entries(rate).reduce(
            (acc, [source, value]) => {
              if (value !== null) {
                acc[source] = ((value - averageRate) / averageRate) * 100;
              }
              return acc;
            },
            {} as Record<string, number>,
          )
        : null;

    const maximumFractionDigits = [CURRENCY_CODE.BTC].includes(from) || [CURRENCY_CODE.HUF].includes(to) ? 0 : 2;

    const RateDisplay: React.FC<RateDisplayProps> = ({ value, source, from, to, amount, maximumFractionDigits }) => (
      <div className="flex items-center space-x-2 text-sm">
        <MoneyValue amount={amount} currency={from} useColors={false} />
        <Equal className="h-3 w-3 text-muted-foreground" />
        <div className="flex-1 flex items-start">
          <MoneyValue
            amount={amount * value}
            currency={to}
            maximumFractionDigits={maximumFractionDigits}
            useColors={false}
          />
          <sup className="ml-1 mt-2 text-[8px] font-medium text-muted-foreground">{source}</sup>
        </div>
        {diff && diff[source] !== undefined && (
          <span
            className={cn('text-[10px] font-medium', {
              'text-success': diff[source] >= 0,
              'text-destructive': diff[source] < 0,
            })}
          >
            {diff[source] >= 0 ? '+' : ''}
            {diff[source].toFixed(1)}%
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
            amount={amount}
            from={from}
            maximumFractionDigits={maximumFractionDigits}
            source="fx"
            to={to}
            value={rate.fixer}
          />
        )}
        {rate.mono !== null && (
          <div className="mt-1 text-muted-foreground">
            <RateDisplay
              amount={amount}
              from={from}
              maximumFractionDigits={maximumFractionDigits}
              source="mb"
              to={to}
              value={rate.mono}
            />
          </div>
        )}
        {rate.wise !== null && (
          <div className="mt-1 text-muted-foreground">
            <RateDisplay
              amount={amount}
              from={from}
              maximumFractionDigits={maximumFractionDigits}
              source="ws"
              to={to}
              value={rate.wise}
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
        <RateComparison amount={1000} from={CURRENCY_CODE.HUF} to={CURRENCY_CODE.UAH} />
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
