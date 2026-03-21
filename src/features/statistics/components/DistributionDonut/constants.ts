import { resolveHsl, resolveHslOrMuted } from '@/lib/resolveCssVar';

/** Map of currency code → CSS var name for themed currency colors */
const CURRENCY_VAR_MAP: Record<string, string> = {
  EUR: '--currency-eur',
  USD: '--currency-usd',
  UAH: '--currency-uah',
  HUF: '--currency-huf',
  BTC: '--currency-btc',
};

/** Resolve a currency code to its themed color (hsl string). */
export const getCurrencyColor = (code: string): string =>
  CURRENCY_VAR_MAP[code] ? resolveHsl(CURRENCY_VAR_MAP[code]) : resolveHslOrMuted('--muted-foreground');

/** Fallback color for unknown items — uses themed muted foreground. */
export const getDefaultColor = (): string => resolveHslOrMuted('--muted-foreground');
