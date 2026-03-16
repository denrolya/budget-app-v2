import { useQuery } from '@tanstack/react-query';

import { CURRENCY_CODE } from '@/constants/currency';
import { axiosFetcher } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExchangeRateSnapshot = {
  id: number;
  effectiveAt: string; // ISO datetime, e.g. "2025-02-05T12:00:00+00:00"
  usdPerEur: number | null; // 1 EUR = N USD
  hufPerEur: number | null; // 1 EUR = N HUF
  uahPerEur: number | null; // 1 EUR = N UAH
  eurPerBtc: number | null; // 1 BTC = N EUR
  eurPerEth: number | null; // 1 ETH = N EUR
};

export type ExchangeRateSnapshotsData = {
  after: string;
  before: string;
  snapshots: ExchangeRateSnapshot[];
};

// ─── Rate helper ──────────────────────────────────────────────────────────────

/**
 * Derives the exchange rate for a given currency pair from a snapshot.
 * All stored values use EUR as the base; cross-rates are computed via EUR.
 * Returns null if either leg of the conversion is unavailable.
 */
export const getRateFromSnapshot = (
  snapshot: ExchangeRateSnapshot,
  from: CURRENCY_CODE,
  to: CURRENCY_CODE,
): number | null => {
  if (from === to) return 1;

  // Value of 1 unit of `from` expressed in EUR
  const fromToEur: Partial<Record<CURRENCY_CODE, number | null>> = {
    [CURRENCY_CODE.EUR]: 1,
    [CURRENCY_CODE.USD]: snapshot.usdPerEur ? 1 / snapshot.usdPerEur : null,
    [CURRENCY_CODE.HUF]: snapshot.hufPerEur ? 1 / snapshot.hufPerEur : null,
    [CURRENCY_CODE.UAH]: snapshot.uahPerEur ? 1 / snapshot.uahPerEur : null,
    [CURRENCY_CODE.BTC]: snapshot.eurPerBtc, // 1 BTC = eurPerBtc EUR
    [CURRENCY_CODE.ETH]: snapshot.eurPerEth, // 1 ETH = eurPerEth EUR
  };

  // Value of 1 EUR expressed in `to`
  const eurToTarget: Partial<Record<CURRENCY_CODE, number | null>> = {
    [CURRENCY_CODE.EUR]: 1,
    [CURRENCY_CODE.USD]: snapshot.usdPerEur,
    [CURRENCY_CODE.HUF]: snapshot.hufPerEur,
    [CURRENCY_CODE.UAH]: snapshot.uahPerEur,
    [CURRENCY_CODE.BTC]: snapshot.eurPerBtc ? 1 / snapshot.eurPerBtc : null,
    [CURRENCY_CODE.ETH]: snapshot.eurPerEth ? 1 / snapshot.eurPerEth : null,
  };

  const xToEur = fromToEur[from] ?? null;
  const eurToY = eurToTarget[to] ?? null;

  if (xToEur === null || eurToY === null) return null;
  return xToEur * eurToY;
};

// ─── Query hook ───────────────────────────────────────────────────────────────

/**
 * Fetches Fixer-sourced exchange rate snapshots for a date range.
 * Pass `after`/`before` as 'YYYY-MM-DD' strings.
 * The same hook serves both the header trend (30-day window)
 * and the sparklines in the Exchange Rates sheet.
 */
export const useFixerExchangeRates = (after: string, before: string) =>
  useQuery<ExchangeRateSnapshotsData, Error>({
    queryKey: ['fixer', 'snapshots', after, before],
    queryFn: () => axiosFetcher(`/api/v2/exchange-rates/snapshots?after=${after}&before=${before}`),
    staleTime: 1000 * 60 * 60 * 6, // 6 h — snapshots rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 h
    retry: 2,
    enabled: !!after && !!before,
  });
