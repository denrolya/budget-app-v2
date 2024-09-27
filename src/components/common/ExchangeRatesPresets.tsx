import cn from 'classnames';
import { Equal } from 'lucide-react';
import React, { useMemo } from 'react';

import { CURRENCY_CODE } from '@/constants/currency';
import MoneyValue from '@/components/common/MoneyValue';
import { useFixerExchangeRates, useMonobankExchangeRates } from '@/contexts/FinanceData';
import { getExchangeRate } from '@/utils/getExchangeRates';

interface RateComparisonProps {
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount?: number;
}

interface RateDisplayProps {
  value: number;
  source: 'fx' | 'mb';
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount: number;
  maximumFractionDigits: number;
}

export const ExchangeRatesPresets: React.FC = () => {
  const fixerRates = useFixerExchangeRates();
  const monoRates = useMonobankExchangeRates();

  const RateComparison: React.FC<RateComparisonProps> = ({ from, to, amount = 1 }) => {
    const rate = useMemo(() => ({
      fixer: getExchangeRate(from, to, fixerRates),
      mono: getExchangeRate(from, to, monoRates),
    }), [from, to, fixerRates, monoRates]);

    const diff = rate.mono && rate.fixer
      ? ((rate.mono - rate.fixer) / rate.fixer) * 100
      : null;

    const maximumFractionDigits = [CURRENCY_CODE.BTC].includes(from) || [CURRENCY_CODE.HUF].includes(to) ? 0 : 2;

    const RateDisplay: React.FC<RateDisplayProps> = ({ value, source, from, to, amount, maximumFractionDigits }) => (
      <div className="flex items-center space-x-2 text-sm">
        <MoneyValue amount={amount} currency={from} />
        <Equal className="h-3 w-3 text-muted-foreground" />
        <div className="flex-1 flex items-start">
          <MoneyValue amount={amount * value} currency={to} maximumFractionDigits={maximumFractionDigits} />
          <sup className="ml-1 mt-2 text-[8px] font-medium text-muted-foreground">
            {source}
          </sup>
        </div>
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
        {diff !== null && (
          <div className={cn('absolute top-0 right-0 -mt-2 -mr-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium z-10', {
            'bg-success text-success-foreground': diff >= 0,
            'bg-destructive text-destructive-foreground': diff < 0,
          })}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 p-4">
      <RateComparison from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.USD} />

      <div className="grid grid-cols-2 gap-3">
        <RateComparison from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.HUF} />
        <RateComparison from={CURRENCY_CODE.USD} to={CURRENCY_CODE.HUF} />
        <RateComparison from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.UAH} />
        <RateComparison from={CURRENCY_CODE.HUF} to={CURRENCY_CODE.UAH} amount={1000} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <RateComparison from={CURRENCY_CODE.BTC} to={CURRENCY_CODE.EUR} />
        <RateComparison from={CURRENCY_CODE.BTC} to={CURRENCY_CODE.USD} />
      </div>
    </div>
  );
};

export default ExchangeRatesPresets;
