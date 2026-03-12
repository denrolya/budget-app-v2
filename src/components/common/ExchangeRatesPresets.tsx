import { Equal } from 'lucide-react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useCurrencyConverter } from '@/contexts/CurrencyConverter';
import MoneyValue from '@/components/common/MoneyValue';
import RateSparkline from '@/components/common/RateSparkline';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CURRENCY_CODE } from '@/constants/currency';
import { type ConvertedValues } from '@/features/transactions';
import { useExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/hooks/financeData';
import { getExchangeRate } from '@/lib/getExchangeRates';
import {
  type ExchangeRateSnapshot,
  getRateFromSnapshot,
  useFixerExchangeRates,
} from '@/services/api/exchangeRateSnapshots.queries';
import { cn } from '@/lib/utils';

// ─── RateDisplay ─────────────────────────────────────────────────────────────

interface RateDisplayProps {
  value: number;
  source: 'fx' | 'mb' | 'ws';
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount: number;
  maximumFractionDigits: number;
  diffPct: number | undefined;
}

const RateDisplay: React.FC<RateDisplayProps> = ({
  value,
  source,
  from,
  to,
  amount,
  maximumFractionDigits,
  diffPct,
}) => (
  <div className="flex items-center space-x-2 text-sm">
    <MoneyValue amount={amount} currency={from} useColors={false} />
    <Equal className="h-3 w-3 text-muted-foreground flex-none" />
    <div className="flex-1 flex items-start min-w-0">
      <MoneyValue
        amount={amount * value}
        currency={to}
        maximumFractionDigits={maximumFractionDigits}
        useColors={false}
      />
      <sup className="ml-1 mt-2 text-[8px] font-medium text-muted-foreground">{source}</sup>
    </div>
    {diffPct !== undefined && (
      <span
        className={cn('text-[10px] font-medium flex-none rounded px-0.5', {
          'text-success bg-success/10': diffPct >= 0,
          'text-destructive bg-destructive/10': diffPct < 0,
        })}
      >
        {diffPct >= 0 ? '+' : ''}
        {diffPct.toFixed(1)}%
      </span>
    )}
  </div>
);

// ─── RateComparison ───────────────────────────────────────────────────────────

interface RateComparisonProps {
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount?: number;
  fixerRates: ConvertedValues;
  monoRates: ConvertedValues;
  wiseRates: ConvertedValues;
  snapshots: ExchangeRateSnapshot[];
  isLoadingSnapshots: boolean;
}

const RateComparison: React.FC<RateComparisonProps> = ({
  from,
  to,
  amount = 1,
  fixerRates,
  monoRates,
  wiseRates,
  snapshots,
  isLoadingSnapshots,
}) => {
  const rate = useMemo(
    () => ({
      fixer: getExchangeRate(from, to, fixerRates),
      mono: getExchangeRate(from, to, monoRates),
      wise: getExchangeRate(from, to, wiseRates),
    }),
    [from, to, fixerRates, monoRates, wiseRates],
  );

  const averageRate = useMemo(() => {
    const valid = Object.values(rate).filter((r): r is number => r !== null);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  }, [rate]);

  const diff = useMemo(
    () =>
      averageRate !== null
        ? Object.fromEntries(
            Object.entries(rate)
              .filter((entry): entry is [string, number] => entry[1] !== null)
              .map(([src, val]) => [src, ((val - averageRate) / averageRate) * 100]),
          )
        : null,
    [rate, averageRate],
  );

  // Build sparkline series — one point per snapshot
  const sparkData = useMemo(() => {
    const points: Array<{ x: string; y: number }> = [];
    for (const snap of snapshots) {
      const r = getRateFromSnapshot(snap, from, to);
      if (r === null) continue;
      points.push({
        x: moment(snap.effectiveAt).format('YYYY-MM-DD'),
        y: r * amount,
      });
    }
    // Deduplicate by date (keep last), then sort chronologically
    const byDate = new Map<string, number>();
    for (const p of points) byDate.set(p.x, p.y);
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([x, y]) => ({ x, y }));
  }, [snapshots, from, to, amount]);

  const maximumFractionDigits = from === CURRENCY_CODE.BTC || to === CURRENCY_CODE.HUF ? 0 : 2;

  return (
    <div className="bg-muted/20 rounded-md border border-muted overflow-hidden">
      {/* Header + rate rows */}
      <div className="p-2 pb-0">
        <h3 className="text-sm font-bold text-foreground tracking-wide mb-1.5">
          {from} <span className="text-muted-foreground font-normal">/</span> {to}
        </h3>

        {rate.fixer !== null && (
          <RateDisplay
            amount={amount}
            diffPct={diff?.['fixer']}
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
              diffPct={diff?.['mono']}
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
              diffPct={diff?.['wise']}
              from={from}
              maximumFractionDigits={maximumFractionDigits}
              source="ws"
              to={to}
              value={rate.wise}
            />
          </div>
        )}
      </div>

      {/* Sparkline — pulled up slightly so the gradient bleeds into the rate rows */}
      <div className="-mt-4">
        <RateSparkline data={sparkData} isLoading={isLoadingSnapshots} maximumFractionDigits={maximumFractionDigits} />
      </div>
    </div>
  );
};

// ─── ExchangeRatesPresets ─────────────────────────────────────────────────────

type DayRange = 7 | 30 | 90;

const PRESETS: Array<{ label: string; value: DayRange }> = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

export const ExchangeRatesPresets: React.FC = () => {
  const { toggle: toggleCurrencyConverter } = useCurrencyConverter();

  const fixerRates = useExchangeRates().fixer;
  const monoRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const [days, setDays] = useState<DayRange>(30);

  const { fromDate, toDate } = useMemo(
    () => ({
      fromDate: moment().subtract(days, 'days').format('YYYY-MM-DD'),
      toDate: moment().format('YYYY-MM-DD'),
    }),
    [days],
  );

  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useFixerExchangeRates(fromDate, toDate);

  const snapshots = snapshotsData?.snapshots ?? [];

  const sharedProps = { fixerRates, monoRates, wiseRates, snapshots, isLoadingSnapshots };

  return (
    <div className="space-y-3 p-0 md:p-4">
      {/* Time range selector */}
      <div className="flex items-center justify-end">
        <ToggleGroup
          size="sm"
          type="single"
          value={String(days)}
          onValueChange={(v) => v && setDays(Number(v) as DayRange)}
        >
          {PRESETS.map((p) => (
            <ToggleGroupItem value={String(p.value)} className="text-xs px-2.5" key={p.value}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Pair grid */}
      <div className="grid grid-cols-2 gap-3">
        <RateComparison {...sharedProps} from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.HUF} />
        <RateComparison {...sharedProps} from={CURRENCY_CODE.USD} to={CURRENCY_CODE.HUF} />
        <RateComparison {...sharedProps} from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.USD} />
        <RateComparison {...sharedProps} amount={1000} from={CURRENCY_CODE.HUF} to={CURRENCY_CODE.UAH} />
        <RateComparison {...sharedProps} from={CURRENCY_CODE.EUR} to={CURRENCY_CODE.UAH} />
        <RateComparison {...sharedProps} from={CURRENCY_CODE.USD} to={CURRENCY_CODE.UAH} />
        <RateComparison {...sharedProps} from={CURRENCY_CODE.BTC} to={CURRENCY_CODE.EUR} />
        <RateComparison {...sharedProps} from={CURRENCY_CODE.BTC} to={CURRENCY_CODE.USD} />
      </div>

      <Button variant="outline" className="w-full" onClick={toggleCurrencyConverter}>
        Currency Converter
      </Button>
    </div>
  );
};

ExchangeRatesPresets.displayName = 'ExchangeRatesPresets';

export default ExchangeRatesPresets;
