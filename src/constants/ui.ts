/** Debounce delay (ms) for search/text filter inputs */
export const SEARCH_DEBOUNCE_MS = 250;

/** Health grade letter → semantic color class */
export const GRADE_COLOR: Record<string, string> = {
  A: 'text-success',
  B: 'text-success/75',
  C: 'text-warning',
  D: 'text-warning/75',
  F: 'text-destructive',
};
