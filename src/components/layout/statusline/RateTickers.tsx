import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CURRENCY_CODE } from '@/constants/currency';
import { cn } from '@/lib/utils';
import { getRateFromSnapshot, useFixerExchangeRates } from '@/services/api/exchangeRateSnapshots.queries';

// ── Config ────────────────────────────────────────────────────────────────────

const PAIRS = [
  { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.USD },
  { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.HUF },
  { from: CURRENCY_CODE.USD, to: CURRENCY_CODE.HUF },
  { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.UAH },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

const RateTickers: React.FC = () => {
  const { afterDate, beforeDate } = useMemo(
    () => ({
      afterDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      beforeDate: moment().format('YYYY-MM-DD'),
    }),
    [],
  );

  const { data } = useFixerExchangeRates(afterDate, beforeDate);
  const snapshots = useMemo(() => data?.snapshots ?? [], [data?.snapshots]);

  const pairData = useMemo(() => {
    const map = new Map<string, { rate: number | null; isUp: boolean | null }>();
    if (!snapshots.length) return map;

    const sorted = [...snapshots].sort((a, b) => new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    for (const { from, to } of PAIRS) {
      const r0 = getRateFromSnapshot(first, from, to);
      const r1 = getRateFromSnapshot(last, from, to);
      const isUp = r0 !== null && r1 !== null ? r1 >= r0 : null;
      map.set(`${from}/${to}`, { rate: r1, isUp });
    }
    return map;
  }, [snapshots]);

  // Flash class tracking per pair
  const [flashMap, setFlashMap] = useState<Map<string, string>>(new Map());
  const prevRates = useRef<Map<string, number | null>>(new Map());

  useEffect(() => {
    const updates = new Map<string, string>();
    for (const { from, to } of PAIRS) {
      const key = `${from}/${to}`;
      const current = pairData.get(key)?.rate ?? null;
      const prev = prevRates.current.get(key) ?? null;
      if (prev !== null && current !== null && current !== prev) {
        updates.set(key, current > prev ? 'rate-flash-up' : 'rate-flash-down');
      }
      prevRates.current.set(key, current);
    }
    if (updates.size > 0) {
      setFlashMap(updates);
      const t = setTimeout(() => setFlashMap(new Map()), 900);
      return () => clearTimeout(t);
    }
  }, [pairData]);

  const formatRate = (rate: number | null, to: CURRENCY_CODE): string => {
    if (rate === null) return '—';
    const decimals = to === CURRENCY_CODE.HUF || to === CURRENCY_CODE.UAH ? 1 : 4;
    return rate.toFixed(decimals);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div title="Exchange rates — click for details" className="flex items-center gap-3 cursor-pointer select-none">
          {PAIRS.map(({ from, to }) => {
            const key = `${from}/${to}`;
            const { rate = null, isUp = null } = pairData.get(key) ?? {};
            const flash = flashMap.get(key) ?? '';
            return (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-mono text-2xs tabular-nums rounded px-0.5 transition-colors duration-150',
                  flash,
                )}
                key={key}
              >
                <span className="text-muted-foreground">
                  {from}/{to}
                </span>
                <span
                  className={cn('font-semibold', {
                    'text-success': isUp === true,
                    'text-destructive': isUp === false,
                    'text-foreground': isUp === null,
                  })}
                >
                  {' '}
                  {formatRate(rate, to)}
                </span>
                {isUp === true && <span className="text-success text-3xs">↑</span>}
                {isUp === false && <span className="text-destructive text-3xs">↓</span>}
                {isUp === null && <span className="text-muted-foreground text-3xs">→</span>}
              </span>
            );
          })}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4">
          <SheetTitle className="text-lg font-semibold text-primary">Exchange Rates</SheetTitle>
          <SheetDescription className="text-xs">Current rates for major currencies</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          <ExchangeRatesPresets />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default React.memo(RateTickers);
