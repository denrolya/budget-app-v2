/**
 * Resolve CSS custom properties to concrete color strings for SVG attributes.
 *
 * SVG presentation attributes (fill, stroke, stop-color) don't support CSS var() references.
 * This utility reads the computed value from the document root and caches it.
 * The cache is invalidated on theme change (class mutation on <html>).
 *
 * Usage:
 *   resolveCssVar('--chart-1')           → "210 85% 50%"  (raw HSL components)
 *   resolveHsl('--chart-1')              → "hsl(210 85% 50%)"
 *   resolveToRgb('--success')            → "rgb(36, 167, 61)"
 *   resolveCssVar('var(--chart-1)')      → "210 85% 50%"  (strips var() wrapper)
 */

let cache = new Map<string, string>();

// Observe class changes on <html> (theme switches) to bust cache
if (typeof window !== 'undefined') {
  const observer = new MutationObserver(() => {
    cache = new Map();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

/** Normalise input: strip `var(` / `)` wrapper if present, ensure leading `--` */
const normalise = (input: string): string => {
  let name = input.trim();
  if (name.startsWith('var(')) name = name.slice(4).replace(/\)$/, '').trim();
  if (!name.startsWith('--')) name = `--${name}`;
  return name;
};

/** Resolve a CSS custom property to its raw computed value (e.g. "210 85% 50%"). */
export const resolveCssVar = (input: string): string => {
  if (typeof window === 'undefined') return '';
  const name = normalise(input);
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  cache.set(name, value);
  return value;
};

/** Check if a value is already a usable CSS color (hex, rgb, hsl with parens). */
const isColor = (v: string): boolean => /^(#|rgb|hsl\()/.test(v);

/** Resolve to a usable CSS color string — wraps in hsl() only if the raw value is HSL components. */
export const resolveHsl = (input: string): string => {
  const raw = resolveCssVar(input);
  if (!raw) return '';
  // Already a usable color (hex, rgb(...), hsl(...))
  if (isColor(raw)) return raw;
  // Raw HSL components like "210 85% 50%"
  return `hsl(${raw})`;
};

/**
 * Resolve to an `rgb(...)` string — needed for SVG gradient stop-color attributes.
 * Uses a temporary element so the browser does the HSL → RGB conversion.
 */
export const resolveToRgb = (input: string): string => {
  if (typeof window === 'undefined') return '';
  const name = normalise(input);
  const cacheKey = `${name}:rgb`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const raw = resolveCssVar(name);
  if (!raw) return '';

  const el = document.createElement('span');
  el.style.color = `hsl(${raw})`;
  document.documentElement.appendChild(el);
  const resolved = getComputedStyle(el).color;
  el.remove();

  cache.set(cacheKey, resolved);
  return resolved;
};

/** Resolve, falling back to `hsl(var(--muted-foreground))` if the var is empty. */
export const resolveHslOrMuted = (input: string): string => resolveHsl(input) || resolveHsl('--muted-foreground');
