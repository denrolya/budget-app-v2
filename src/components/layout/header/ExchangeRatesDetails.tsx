import moment from 'moment';
import React, { useMemo } from 'react';

import ExchangeRatesPresets from '@/components/common/ExchangeRatesPresets';
import MoneyValue from '@/components/common/MoneyValue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CURRENCY_CODE } from '@/constants/currency';
import { cn } from '@/lib/utils';
import { getRateFromSnapshot, useFixerExchangeRates } from '@/services/api/exchangeRateSnapshots.queries';

// ─── Static config ────────────────────────────────────────────────────────────

const HEADER_PAIRS = [
  { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.USD },
  { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.HUF },
  { from: CURRENCY_CODE.USD, to: CURRENCY_CODE.HUF },
  { from: CURRENCY_CODE.EUR, to: CURRENCY_CODE.UAH },
  { from: CURRENCY_CODE.USD, to: CURRENCY_CODE.UAH },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export const ExchangeRatesDetails: React.FC = () => {
  // 30-day window — same range ExchangeRatesPresets defaults to,
  // so TanStack Query serves both from the same cached response.
  const { fromDate, toDate } = useMemo(
    () => ({
      fromDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      toDate: moment().format('YYYY-MM-DD'),
    }),
    [], // stable for the session — no Fixer request needed
  );

  const { data: snapshotsData } = useFixerExchangeRates(fromDate, toDate);
  const snapshots = snapshotsData?.snapshots ?? [];

  // Derive both current rate (last snapshot) and 30-day trend in one pass
  const pairData = useMemo(() => {
    const map = new Map<string, { rate: number | null; isUp: boolean | null }>();

    if (snapshots.length === 0) return map;

    const sorted = [...snapshots].sort((a, b) => new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    for (const { from, to } of HEADER_PAIRS) {
      const r0 = getRateFromSnapshot(first, from, to);
      const r1 = getRateFromSnapshot(last, from, to);
      const isUp = r0 !== null && r1 !== null ? r1 >= r0 : null;
      map.set(`${from}/${to}`, { rate: r1, isUp });
    }

    return map;
  }, [snapshots]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="hidden md:flex items-center text-xs space-x-2">
          {HEADER_PAIRS.map(({ from, to }) => {
            const key = `${from}/${to}`;
            const data = pairData.get(key);
            const rate = data?.rate ?? null;
            const isUp = data?.isUp ?? null;

            return (
              <div
                className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                key={key}
              >
                <span className="antialiased">
                  {from}/{to}
                </span>
                {/* Wrapper drives the colour — MoneyValue inner spans inherit it */}
                <span
                  className={cn({
                    'text-success opacity-75': isUp === true,
                    'text-destructive opacity-75': isUp === false,
                  })}
                >
                  <MoneyValue
                    amount={rate ?? 0}
                    currency={to}
                    showSymbol={false}
                    useColors={false}
                    className="font-semibold"
                  />
                </span>
              </div>
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

export default ExchangeRatesDetails;
