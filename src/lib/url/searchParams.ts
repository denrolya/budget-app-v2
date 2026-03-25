import moment, { type Moment } from 'moment';

export type Scalar = string | number | boolean | null | undefined;
export type ScalarOrArray<T extends Scalar = Scalar> = T | T[];

/**
 * Positional amount range: preserves NaN as a sentinel for "no value at this
 * position" so [NaN, 500] = "no min, max=500". Returns [] when all positions
 * are empty (no effective filter).
 */
export const toAmountRange = (value: ScalarOrArray): number[] => {
  if (value === null || value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  if (arr.length === 0) return [];
  const mapped = arr.map((v) => {
    if (v === null || v === undefined) return NaN;
    return typeof v === 'number' ? v : Number(String(v).trim());
  });
  if (mapped.every((n) => !Number.isFinite(n))) return [];
  return mapped;
};

/**
 * Parse a positional CSV amount range from URLSearchParams.
 * e.g. ",500" → [NaN, 500], "100," → [100, NaN], "100,500" → [100, 500]
 */
export const readParamAmountRange = (sp: URLSearchParams, key: string): number[] => {
  const raw = sp.get(key);
  if (!raw) return [];
  const [minStr, maxStr] = raw.split(',').map((s) => s.trim());
  const min = minStr ? Number(minStr) : NaN;
  const max = maxStr !== undefined ? (maxStr ? Number(maxStr) : NaN) : NaN;
  const result = [min, max];
  return result.every((n) => !Number.isFinite(n)) ? [] : result;
};

export const readParamString = (sp: URLSearchParams, key: string): string | undefined => {
  const v = sp.get(key);
  if (v === null) return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
};

export const readParamNumber = (sp: URLSearchParams, key: string): number | undefined => {
  const v = sp.get(key);
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const readParamBool = (sp: URLSearchParams, key: string): boolean | undefined => {
  const v = sp.get(key);
  if (v === null) return undefined;
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return undefined;
};

/**
 * Supports both:
 *  - repeated keys: ?accounts=1&accounts=2
 *  - CSV:          ?accounts=1,2
 */
export const readParamArray = (sp: URLSearchParams, key: string): string[] => {
  const all = sp
    .getAll(key)
    .flatMap((v) => v.split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  return all;
};

export const readParamNumberArray = (sp: URLSearchParams, key: string): number[] =>
  readParamArray(sp, key)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));

/**
 * CSV range helper, e.g. ?amount=10,200
 */
export const readParamNumberRange = (sp: URLSearchParams, key: string): { min?: number; max?: number } | undefined => {
  const raw = sp.get(key);
  if (!raw) return undefined;

  const [a, b] = raw.split(',').map((s) => s.trim());
  const min = a ? Number(a) : undefined;
  const max = b ? Number(b) : undefined;

  const out: { min?: number; max?: number } = {};
  if (min !== undefined && Number.isFinite(min)) out.min = min;
  if (max !== undefined && Number.isFinite(max)) out.max = max;

  return Object.keys(out).length ? out : undefined;
};

export const readParamMoment = (sp: URLSearchParams, key: string, format: string): Moment | undefined => {
  const raw = readParamString(sp, key);
  if (!raw) return undefined;

  const m = moment(raw, format, true);
  return m.isValid() ? m : undefined;
};
