# moment → date-fns Migration Plan

## Why

|             | moment                                           | date-fns                        |
| ----------- | ------------------------------------------------ | ------------------------------- |
| Status      | **Maintenance mode** since 2020, no new features | Actively maintained             |
| Bundle size | ~290 kB, non-tree-shakeable                      | ~13 kB tree-shakeable           |
| Type        | Mutable objects (`.clone()` everywhere)          | Immutable native `Date` objects |
| TypeScript  | Own `Moment` type leaks into all layers          | Native `Date`, no custom types  |

Decision: **keep date-fns, remove moment**.

---

## Scope

`grep -rl "moment" src/` returns **~85 files**. The `Moment` type is used as the
shared date carrier across the entire app (`Timeframe`, filters, URL params, hooks,
components). The migration cascades from the type definition outward.

---

## Format-token translation table

Most bugs come from silently swapping tokens between libraries.

| Concept                | moment token | date-fns token       |
| ---------------------- | ------------ | -------------------- |
| 4-digit year           | `YYYY`       | `yyyy`               |
| 2-digit year           | `YY`         | `yy`                 |
| Day of month (no pad)  | `D`          | `d`                  |
| Day of month (ordinal) | `Do`         | `do`                 |
| Full weekday name      | `dddd`       | `EEEE`               |
| Short weekday name     | `ddd`        | `EEE`                |
| Day of week (0=Sun)    | `d`          | `i` (isoWeek) or `e` |
| ISO week day           | `E`          | `i`                  |
| 24-hour hour           | `HH`         | `HH` (same)          |

> **Critical**: `YYYY-MM-DD` (moment) becomes `yyyy-MM-dd` (date-fns). The
> backend expects `YYYY-MM-DD`, so `BACKEND_DATE_FORMAT` must be updated and any
> call that passes a moment-formatted string to the API must be reviewed.

---

## API translation table

| moment                        | date-fns equivalent                              |
| ----------------------------- | ------------------------------------------------ |
| `moment()`                    | `new Date()`                                     |
| `moment(value)`               | `new Date(value)`                                |
| `moment(str, fmt, true)`      | `parse(str, fmt, new Date())` + `isValid()`      |
| `moment.isMoment(x)`          | `x instanceof Date && isValid(x)`                |
| `date.clone()`                | `new Date(date)`                                 |
| `date.toDate()`               | already a `Date` — no-op                         |
| `date.format(fmt)`            | `format(date, fmt)`                              |
| `date.fromNow()`              | `formatDistanceToNow(date, { addSuffix: true })` |
| `date.startOf('day')`         | `startOfDay(date)`                               |
| `date.endOf('day')`           | `endOfDay(date)`                                 |
| `date.startOf('month')`       | `startOfMonth(date)`                             |
| `date.endOf('month')`         | `endOfMonth(date)`                               |
| `date.startOf('year')`        | `startOfYear(date)`                              |
| `date.endOf('year')`          | `endOfYear(date)`                                |
| `date.startOf('isoWeek')`     | `startOfISOWeek(date)`                           |
| `date.endOf('isoWeek')`       | `endOfISOWeek(date)`                             |
| `date.add(n, 'days')`         | `addDays(date, n)`                               |
| `date.add(n, 'months')`       | `addMonths(date, n)`                             |
| `date.add(n, 'years')`        | `addYears(date, n)`                              |
| `date.subtract(n, 'days')`    | `subDays(date, n)`                               |
| `date.subtract(n, 'months')`  | `subMonths(date, n)`                             |
| `date.subtract(n, 'years')`   | `subYears(date, n)`                              |
| `date.subtract(n, 'weeks')`   | `subWeeks(date, n)`                              |
| `date.isSame(other, 'day')`   | `isSameDay(date, other)`                         |
| `date.isSame(other, 'month')` | `isSameMonth(date, other)`                       |
| `date.isSame(other, 'year')`  | `isSameYear(date, other)`                        |
| `date.isBefore(other)`        | `isBefore(date, other)`                          |
| `date.isAfter(other)`         | `isAfter(date, other)`                           |
| `date.diff(other, unit)`      | `differenceInDays/Months/Years(date, other)`     |
| `date.year()`                 | `getYear(date)`                                  |
| `date.month(n)`               | `setMonth(date, n)` (0-indexed, same as moment)  |
| `date.date()`                 | `getDate(date)`                                  |
| `date.day()`                  | `getDay(date)` (0=Sun)                           |
| `date.isoWeek()`              | `getISOWeek(date)`                               |
| `moment.duration(n, unit)`    | no direct equivalent — use plain arithmetic      |
| `moment.duration(a.diff(b))`  | use `differenceIn*` directly                     |

---

## Phase-by-phase plan

Work **strictly top-down** — the `Timeframe` type in `types/global.d.ts` fans out
everywhere, so changing it first makes TypeScript surface every downstream site.

### Phase 1 — Type layer (start here)

**`src/types/global.d.ts`**

```ts
// BEFORE
import { type Moment } from 'moment';
export interface Timeframe {
  after: Moment;
  before: Moment;
}
export interface TimeframeStep {
  unit: moment.unitOfTime.DurationConstructor;
  amount: number;
}

// AFTER
export interface Timeframe {
  after: Date;
  before: Date;
}
export interface TimeframeStep {
  unit: 'day' | 'week' | 'month' | 'quarter' | 'year';
  amount: number;
}
// Remove all moment imports
```

After this change, TypeScript will error everywhere `Moment` is expected but `Date`
is passed. Use those errors to drive the remaining phases.

**`src/constants/datetime.ts`**

- Replace every `moment().xxx()` preset with date-fns equivalents.
- Update all format string constants: `BACKEND_DATE_FORMAT` stays `'yyyy-MM-dd'` (only
  the constant value changes, not the output — the backend still receives `YYYY-MM-DD`).
- Remove `MOMENT_DATEPICKER_FORMAT`, `MOMENT_DATE_GENERIC_FORMAT`,
  `MOMENT_DATE_VIEW_FORMAT`, `MOMENT_DATE_VIEW_FORMAT_2`, `MOMENT_DATETIME_VIEW_FORMAT`,
  `MOMENT_DATETIME_FORM_FORMAT`, `MOMENT_DATETIME_DISPLAY_FORMAT`. Replace with
  `DATE_FNS_*` equivalents.
- Preset arrays (`TIMEFRAME_OPTIONS`, `DASHBOARD_TIMEFRAME_OPTIONS`, `FILTER_PRESETS`)
  need every `moment().xxx()` call replaced — the presets are evaluated at module load
  time, so they produce stale dates anyway. Consider making them functions:
  ```ts
  export const getFilterPresets = (): Timeframe[] => [
    { after: startOfMonth(new Date()), before: endOfMonth(new Date()) },
    ...
  ];
  ```

### Phase 2 — Model/filter classes

**`src/models/BaseFilters.ts`**

- `moment.isMoment(current)` → `current instanceof Date && isValid(current)`
- `.isSame(original, 'day')` → `isSameDay(current, original)`

**`src/features/transactions/models/TransactionFilters.ts`**

- `moment()` → `new Date()`
- `.subtract(30, 'days')` → `subDays(new Date(), 30)`
- `.clone()` → `new Date(date)`
- `isMomentLike` guard → `(v): v is Date => v instanceof Date && isValid(v)`
- `moment(value as any)` coercion → `new Date(value as any)`, check with `isValid()`

**`src/features/transfers/models/TransferFilters.ts`**

- `moment().endOf('year')` → `endOfYear(new Date())`
- `moment().startOf('year')` → `startOfYear(new Date())`
- `.clone()` → `new Date(date)`
- `format` ctx: `BACKEND_DATE_FORMAT` is now a date-fns format string — use
  `format(date, BACKEND_DATE_FORMAT)` (already from date-fns)

### Phase 3 — URL / serialization layer

**`src/lib/url/searchParams.ts`**

```ts
// BEFORE
const m = moment(raw, format, true);
return m.isValid() ? m : null;

// AFTER
import { parse, isValid } from 'date-fns';
const d = parse(raw, format, new Date());
return isValid(d) ? d : null;
```

**`src/lib/url/buildListStateSearchQueryParams.ts`**

```ts
// BEFORE
if (moment.isMoment(value)) params.set(paramKey, value.format(formatMoment));

// AFTER
import { format, isValid } from 'date-fns';
if (value instanceof Date && isValid(value)) params.set(paramKey, format(value, formatDateFns));
```

**`src/lib/url/generateQueryParamsString.ts`**

```ts
// BEFORE
after: after?.format(afterFormat);

// AFTER
import { format } from 'date-fns';
after: after ? format(after, afterFormat) : undefined;
```

**`src/lib/isSameValue.ts`**

```ts
// BEFORE
moment.isMoment(a) && moment.isMoment(b) ? a.isSame(b, 'day') : isEqual(a, b);

// AFTER
import { isSameDay, isValid } from 'date-fns';
a instanceof Date && b instanceof Date && isValid(a) && isValid(b) ? isSameDay(a, b) : isEqual(a, b);
```

### Phase 4 — Datetime utilities

**`src/lib/datetime/formatShortDate.ts`**

```ts
// BEFORE (moment)
const today = moment();
if (date.isSame(today, 'day')) return 'Today';
return date.format(date.isSame(today, 'year') ? 'MMM D' : 'MMM D, YYYY');

// AFTER (date-fns)
import { isToday, isSameYear, format } from 'date-fns';
if (isToday(date)) return 'Today';
return format(date, isSameYear(date, new Date()) ? 'MMM d' : 'MMM d, yyyy');
```

Note the token change: `D` → `d` for day of month.

**`src/lib/datetime/generatePreviousTimeframe.ts`**

Heavy usage — almost every Moment API is used here. Full rewrite with date-fns:

- `moment.isMoment(x)` → `x instanceof Date && isValid(x)`
- `.isAfter()` → `isAfter()`
- `.isSame(x.clone().startOf('year'))` → `isSameDay(date, startOfYear(date))`
- `.isSame(x.clone().endOf('year'))` → `isSameDay(date, endOfYear(date))`
- `.date() === 1` → `getDate(date) === 1`
- `.clone().subtract(n, 'years').startOf('year')` → `startOfYear(subYears(date, n))`
- `.diff(other, unit)` → `differenceInDays/Months/Years(a, b)`
- `moment(\`${y}-12-31\`).isoWeek()`→`getISOWeek(new Date(y, 11, 31))`
- `.subtract(n, 'weeks').startOf('isoWeek')` → `startOfISOWeek(subWeeks(date, n))`

### Phase 5 — Hooks

**`src/hooks/useTimeframeControl.ts`**

Key replacements:

```ts
// BEFORE
const getPeriodDuration = (period: ISO8601Period): moment.Duration => { ... }
const now = moment();
after: now.clone().subtract(1, 'month').startOf('month'),
before: now.clone().endOf('month'),
const timeframeDuration = useMemo(() => moment.duration(timeframe.before.diff(timeframe.after)), [...]);

// AFTER
// Drop getPeriodDuration — compute directly with differenceIn* and sub/add helpers
const now = new Date();
after: startOfMonth(subMonths(now, 1)),
before: endOfMonth(now),
// For duration-based navigation, use differenceInMilliseconds or differenceInDays
```

The `TimeframeStep.unit` type was `moment.unitOfTime.DurationConstructor`. After
Phase 1 it becomes a plain union — update `useTimeframeControl` to use plain
`addDays/addWeeks/addMonths/addYears` branches instead of `moment().add(duration)`.

**`src/hooks/statistics/useTimelineStatisticsRequest.ts`** and sibling hooks:

- Each one receives `Timeframe` and calls `.format(BACKEND_DATE_FORMAT)` on `after`/`before`.
- After migration: `format(after, BACKEND_DATE_FORMAT)` from date-fns.

### Phase 6 — Components

**`src/components/common/RelativeDatetimeDisplay.tsx`**

```ts
// BEFORE
date: Moment; // prop type
date.fromNow();
date.isSame(now, 'day');
date.day(); // 0=Sun
date.year();
date.format(fmt);

// AFTER
date: Date;
formatDistanceToNow(date, { addSuffix: true });
isSameDay(date, now);
getDay(date); // still 0=Sun
getYear(date);
format(date, dateFnsFmt);
```

Format strings inside `DATE_FORMATS` object:

- `'MMM D, HH:mm'` → `'MMM d, HH:mm'`
- `'MMM D, YYYY, HH:mm'` → `'MMM d, yyyy, HH:mm'`
- `'M/D, HH:mm'` → `'M/d, HH:mm'`
- `'M/D/YY, HH:mm'` → `'M/d, yy, HH:mm'`
- `'dddd, MMMM D, HH:mm'` → `'EEEE, MMMM d, HH:mm'`
- etc.

**`src/components/common/DaterangePickerWithPresets.tsx`**

```ts
// BEFORE
after: Moment;
before: Moment;
const committed = { from: after.toDate(), to: before.toDate() };
const nextAfter = moment(next.from).startOf('day');
range.after.clone().startOf('day').toDate();

// AFTER
after: Date;
before: Date;
const committed = { from: after, to: before };
const nextAfter = startOfDay(next.from);
startOfDay(range.after);
```

This is a **high-traffic component** — it receives `Timeframe` and currently bridges
`Moment ↔ native Date` internally. After migration the bridge is gone.

**All remaining ~60 component/feature files** that import moment:

- `features/accounts/**`, `features/budget/**`, `features/transactions/**`,
  `features/transfers/**`, `features/statistics/**`, `features/ledger/**`,
  `features/debts/**`, `features/buckets/**`
- Pattern is uniform: receive `Moment` prop → call `.format()` / `.isSame()` / `.diff()`
- Replace prop types with `Date`, replace method calls with date-fns functions.

Models that hold `Moment` dates:

- `features/transactions/models/Transaction.ts`
- `features/transfers/models/Transfer.ts`
- `features/debts/models/Debt.ts`
- `features/accounts/models/Account.ts`
- `features/categories/models/Category.ts`

Each parses a date string from the API DTO and stores it. Change from
`moment(isoStr)` to `new Date(isoStr)` and update the stored field type.

### Phase 7 — Cleanup

```bash
pnpm remove moment
pnpm remove @types/moment   # if present
```

Remove from `constants/datetime.ts`:

- `DATE_FNS_DATE_FORMAT` — by now `BACKEND_DATE_FORMAT` IS the date-fns format string,
  so the separate constant is redundant.
- Any remaining `MOMENT_*` constants.

Run `tsc --noEmit` and fix remaining type errors. Run the full test suite.

---

## Files that do NOT need changes

- `react-day-picker` / `Calendar` component — already uses native `Date`.
- `BankPanel.tsx` / `BankSheet.tsx` — already migrated to `format(date, DATE_FNS_DATE_FORMAT)` from date-fns.
- `src/constants/ui.ts` — no dates.

---

## Gotchas

1. **`month()` is 0-indexed in both** moment and `setMonth`/`getMonth` — no change needed.
2. **`isSameWeek` vs ISO week** — moment's `startOf('isoWeek')` is Monday. date-fns
   `startOfWeek` defaults to Sunday. Always use `startOfISOWeek` / `endOfISOWeek`.
3. **Preset arrays are module-level** — they capture `new Date()` at import time, not at
   render time. This is the same problem as with moment; consider converting them to
   factory functions (or accept the ~1-second staleness for long-lived tabs).
4. **`moment(str, fmt, true)` strict parsing** — the third argument (`true`) enables
   strict mode. date-fns `parse()` is always strict. Equivalent: `parse(str, fmt, new Date())`.
5. **`.diff()` sign** — `moment a.diff(b)` = `a - b`. date-fns `differenceInDays(a, b)` = `a - b`. Same sign convention.
6. **`formatDistanceToNow`** — import from `date-fns`, not `date-fns/formatDistanceToNow`.
   Tree-shaking handles the rest.
7. **`DebugLogger.ts`** — imports moment for timestamp formatting; update to `format(new Date(), ...)`.

---

## Suggested commit sequence

```
feat(datetime): replace Timeframe type with native Date
feat(datetime): migrate constants/datetime.ts presets to date-fns
feat(datetime): migrate filter models to date-fns
feat(datetime): migrate URL serialization layer to date-fns
feat(datetime): migrate datetime utility functions to date-fns
feat(datetime): migrate hooks to date-fns
feat(datetime): migrate all components and feature files to date-fns
chore(datetime): remove moment dependency
```

Each commit should leave the app in a working state (no TypeScript errors, tests passing).
