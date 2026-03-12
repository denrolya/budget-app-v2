import moment, { type Moment } from 'moment';

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
