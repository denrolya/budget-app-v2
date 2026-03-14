# Frontend Code Standards

React 18 + TypeScript + Vite + TanStack Query v5 + shadcn/ui + Tailwind + Nivo.
Package manager: **pnpm**.

---

## Tooling Constraints

### TypeScript (`tsconfig.app.json`)

- `strict: true` — no escape hatches
- `noUnusedLocals` / `noUnusedParameters` — enforced at compile time
- `allowJs: false` — TypeScript only
- Path alias: `@/*` → `./src/*` (always prefer over relative `../../`)

### ESLint (`eslint.config.js`)

- `@typescript-eslint/no-unused-vars` — **error** (prefix unused params with `_`)
- `@typescript-eslint/no-explicit-any` — **warn**; do not introduce new `any`
- `@typescript-eslint/consistent-type-imports` — **error**; use `import type` for type-only imports
- `no-console` — **warn**; remove debug logs before merging
- `func-style: expression` — always use arrow functions, never `function` declarations
- `arrow-body-style: as-needed` — omit braces/return when body is a single expression
- `prefer-arrow-callback` — no `function` in callbacks
- `quotes: single`, `semi: always`
- `import/order` — enforced group order with blank lines between groups (see Imports section)
- `perfectionist/sort-jsx-props` — props sorted alphabetically; shorthand first, handlers/className last

### Prettier (`.prettierrc`)

```json
{ "printWidth": 120, "tabWidth": 2, "useTabs": false, "semi": true, "singleQuote": true, "trailingComma": "all" }
```

---

## Principles

- **KISS & DRY** — the minimum complexity that solves the problem
- **No file over ~400 LOC** — if it's growing, split it
- **Low cyclomatic/cognitive complexity** — flatten conditions, extract named booleans, use early returns
- **No dead code** — remove it; `knip` is configured to detect it
- **No ternaries in JSX render** — use variables, early returns, or extracted components instead
- **No nested ternaries anywhere**
- **Comments in English only** — only for non-trivial logic and `// TODO:` annotations; no obvious comments

---

## File & Folder Structure

```
src/
  features/{feature}/         # Feature-sliced vertical slice
    api/
      index.ts                # Barrel re-export
      keys.ts                 # Query key factory object
      queries.ts              # useQuery hooks
      mutations.ts            # useMutation hooks (all in useMutations())
      service.ts              # Pure async API calls, no React
    components/               # Feature-scoped components
    hooks/                    # Feature-scoped hooks
    models/                   # Domain classes + raw data interfaces
    routes/                   # Page (route) components
    types.ts                  # DTOs, enums, domain interfaces
    index.ts                  # Public barrel (only export what's needed outside)

  components/
    common/                   # Shared reusable UI components
    layout/                   # App shell and layout components
    ui/                       # shadcn/ui primitives — DO NOT MODIFY

  constants/                  # App-wide constants (SCREAMING_SNAKE_CASE values)
  contexts/                   # React contexts + providers
  hooks/                      # Global shared hooks
  lib/                        # Pure utility/helper functions
    utils.ts                  # cn() lives here
    datetime/                 # Date helpers
    url/                      # URL helpers
  models/                     # Global domain models
  services/                   # API client, storage, loggers
  types/                      # Global TypeScript types
  assets/styles/              # SCSS + CSS variables / theming
```

**Follow this structure strictly.** Do not invent new top-level folders.
New feature code lives inside `features/{feature}/`; only truly cross-feature code goes to `components/common/`, `hooks/`, or `lib/`.

---

## Naming

| Thing                | Convention                     | Example                                                 |
| -------------------- | ------------------------------ | ------------------------------------------------------- |
| React component file | PascalCase `.tsx`              | `AccountTypeahead.tsx`                                  |
| Hook file            | camelCase `.ts(x)`             | `useBuckets.ts`                                         |
| Model class file     | PascalCase `.ts`               | `Account.ts`                                            |
| Service / util file  | camelCase `.ts`                | `formatMoney.ts`                                        |
| Constants file       | camelCase `.ts`                | `currency.ts`                                           |
| Component            | PascalCase                     | `const MoneyValue: React.FC<Props> = ...`               |
| Hook                 | `use` prefix, camelCase        | `useListState`, `useMutations`                          |
| Domain model class   | PascalCase                     | `class Account`, `class Transaction`                    |
| Constants            | SCREAMING_SNAKE_CASE           | `STORAGE_KEY`, `PRESET_BUCKETS`                         |
| Enum                 | PascalCase + PascalCase values | `enum Type { Expense = 'expense' }`                     |
| Type / Interface     | PascalCase                     | `interface HeatmapFilters`                              |
| DTO types            | `CreateXDTO`, `UpdateXDTO`     | `CreateAccountDTO`                                      |
| Raw API shape        | `XRawData` or `RawXDTO`        | `AccountRawData`, `RawTransactionDTO`                   |
| Query key object     | `queryKeys`                    | `queryKeys.list()`, `queryKeys.balanceHistory(id, ...)` |
| API service object   | `xService`                     | `accountService.fetchList(rates)`                       |

**No version suffixes** on new files (`V2`, `V3` etc). If replacing a component, delete the old one.

---

## API Layer Pattern

Each feature's `api/` follows a strict four-file layout:

```ts
// keys.ts — pure query key factories, no React
export const queryKeys = {
  all: ['accounts'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
};

// service.ts — pure async functions, no hooks, no React
export const accountService = {
  async fetchList(rates: ExchangeRates): Promise<Account[]> { ... },
};

// queries.ts — useQuery hooks, import from service + keys
export const useList = () =>
  useQuery({ queryKey: queryKeys.list(), queryFn: () => accountService.fetchList(...) });

// mutations.ts — all mutations grouped in one hook
export const useMutations = () => {
  const createMutation = useMutation({ ... });
  return { create: createMutation.mutateAsync, isCreating: createMutation.isPending };
};

// index.ts — re-export only the public API
export { useList } from './queries';
export { useMutations } from './mutations';
export type { HeatmapFilters } from './service';
```

### API Contract (types)

Backend (API Platform) returns **snake_case** JSON; Axios/API Platform auto-converts to **camelCase** on the way in.
All raw response types use **camelCase** field names:

```ts
// Raw shape exactly as received — define as interface or type
export interface AccountRawData {
  id: number;
  createdAt: string;         // snake_case from server → camelCase in TS
  isDisplayedOnSidebar: boolean;
}

// Domain model wraps the raw data
export default class Account {
  constructor(data: AccountRawData) { ... }
}

// Request DTOs — camelCase too
export type CreateAccountDTO = { name: string; currency: string; };
```

---

## Component Patterns

```tsx
// Props interface above the component
interface MoneyValueProps {
  amount: number;
  currency: string;
  className?: string;
}

// React.FC<Props> — always typed
const MoneyValue: React.FC<MoneyValueProps> = ({ amount, currency, className }) => {
  // derive display values BEFORE the return
  const formatted = formatMoney(amount, currency);

  return <span className={className}>{formatted}</span>;
};

export default MoneyValue;
```

- **Default export** for components and page routes
- **Named exports** for hooks, utilities, types, constants
- Props interface always defined above the component (not inline)

### JSX Prop Ordering (enforced by perfectionist)

1. Shorthand boolean props (`disabled`, `required`)
2. Regular props — alphabetical
3. Multiline props
4. Last: `key`, `ref`, `children`, `className`, `*ClassName`, `on*` handlers

---

## Styling

```tsx
// Static classes — plain string
<div className="flex items-center gap-2">

// Conditional classes — cn() with object notation only
<div className={cn('rounded', { 'opacity-50 cursor-default': disabled, 'hover:bg-muted': !disabled })}>

// NEVER use cn() for static-only classes
// NEVER use ternaries inside className strings
```

- `cn()` from `@/lib/utils` — only when classes depend on a condition
- Object notation `{ 'classes': condition }` for conditionals — no ternaries
- Global CSS variables defined in `assets/styles/themes/` — reference via Tailwind or `var(--name)`
- Do not use inline `style={{}}` unless there is no CSS alternative (e.g. dynamic values not coverable by Tailwind)

---

## Conditional Rendering

```tsx
// BAD — ternary in JSX
return <div>{isLoading ? <Spinner /> : <Content />}</div>;

// GOOD — variable before return
const body = isLoading ? <Spinner /> : <Content />;
return <div>{body}</div>;

// BETTER — early return
if (isLoading) return <Spinner />;
return <Content />;

// GOOD — && short-circuit (acceptable for simple show/hide)
return <div>{hasError && <ErrorBanner />}</div>;
```

---

## Import Order

Enforced by `eslint-plugin-import`. Blank line between every group:

```ts
// 1. External packages
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// 2. Internal — absolute (@/ alias)
import { cn } from '@/lib/utils';
import Account from '@/features/accounts/models/Account';

// 3. Relative — parent / sibling
import { queryKeys } from './keys';
import type { AccountRawData } from '../types';
```

---

## Constants

- Define a constant when a value is used in more than one place
- Constants live in `src/constants/` (app-wide) or `{feature}/constants.ts` (feature-scoped)
- SCREAMING_SNAKE_CASE name
- Do **not** extract repeated Tailwind class strings into constants — that's what components are for

---

## Hooks

- Name starts with `use`
- Only custom logic that is reused or that meaningfully reduces component complexity
- Do not create a hook just to wrap a single `useQuery` call that is used once
- Feature-local hooks: `features/{feature}/hooks/`
- Global shared hooks: `src/hooks/`

---

## Utils (`lib/`)

- Pure functions only — no React, no side effects
- One concern per file (e.g. `formatMoney.ts`, `generateSlug.ts`)
- Grouped by domain in sub-folders (`datetime/`, `url/`)
- Do not add a util for one-off logic that belongs in the component or hook that uses it

---

## Design System — Trading Terminal Language

- **`text-2xs`** for micro-labels, captions, chip text, inline toolbar labels — never `text-[10px]`
- **Inline toolbars** in card headers: segmented period controls, chart-type toggles, category chips — no separate toolbar rows
- **Segmented controls** (`bg-muted rounded-md p-0.5` wrapper, active item `bg-background shadow-sm`) — do not use tab/toggle components for these
- **Color tokens**: always semantic — see _Semantic Colors_ section below
- **No hover shadows** on cards; no `hover:shadow-*` unless explicitly requested

---

## Semantic Colors — Strict Rules

**NEVER use hardcoded Tailwind palette colors for semantic meaning.** Every status/signal color must use a design-token class.

| Meaning                     | ✅ Correct                           | ❌ Forbidden                                   |
| --------------------------- | ------------------------------------ | ---------------------------------------------- |
| Positive / success / income | `text-success`, `bg-success`         | `text-green-*`, `text-emerald-*`, `bg-green-*` |
| Warning / caution           | `text-warning`, `bg-warning`         | `text-yellow-*`, `text-amber-*`, `bg-yellow-*` |
| Negative / error / expense  | `text-destructive`, `bg-destructive` | `text-red-*`, `text-rose-*`, `bg-red-*`        |
| Subdued success (grade B)   | `text-success/75`                    | `text-emerald-500`, `text-green-400`           |
| Subdued warning (grade D)   | `text-warning/75`                    | `text-orange-*`                                |

**Never add `dark:text-green-*` / `dark:text-red-*` variants.** Semantic tokens already handle both modes — adding dark variants creates drift.

**SCSS / CSS**: replace `rgba(0,0,0,X)` and `rgba(255,255,255,X)` with `hsl(var(--foreground) / X)`. A single rule then works for both light and dark without a `.dark {}` override block.

**SVG gradients**: CSS custom properties do not work in SVG presentation attributes. Use `style={{ stopColor: 'hsl(var(--card))' }}` — not `stopColor="hsl(var(--card))"` as an attribute.

---

## Account Display — AccountMarker & AccountPill

- **`AccountMarker`** (`src/features/accounts/components/AccountMarker.tsx`) — canonical shape + color indicator for an account. Sizes: `sm` (h-3 w-3), `md`/`lg` (h-4 w-4). Renders a corner integration-status dot (green = active, amber = inactive). Use this everywhere an account needs a visual symbol.
- **`AccountPill`** (`src/features/accounts/components/Pill.tsx`) — wraps `AccountMarker` + account name + optional balance into a clickable/hoverable pill. Props: `variant="inline"` for embedding in text/lists, `size="sm"`, `tooltip={false}` in dense lists to suppress the hover tooltip.
- **When to use which**: use `AccountMarker` alone when you need just the icon (e.g. status bars, ticker rows). Use `AccountPill` when showing the account name alongside the icon.

---

## Chart Components

### Shared constants

- **`CHART_COLORS`** in `src/constants/recharts.ts` — canonical 10-color palette (`hsl(var(--chart-1))` … `--chart-10`). Import this everywhere; do not declare local `colors[]` arrays.

### MoneyFlow (`src/features/statistics/components/MoneyFlow/`)

- Boundary lines (year / season / month) are **auto-computed from the selected span** — do not add a user toggle for this.
- Tooltip uses `window.mousemove` + `createPortal` (fixed viewport position).

### CategoriesTimeline (`src/features/statistics/components/CategoriesTimeline/`)

- Chart tooltip must have `cursor={false}` to suppress Recharts' white cursor box.
- Category chip colors come from `CHART_COLORS[index]` (matching chart series), not `category.color`.

### DistributionDonut (`src/features/statistics/components/DistributionDonut/`)

- Uses **Nivo**, not Recharts — do not import Recharts components here.

---

## Date Range Picker — Presets & API

- **Component**: `src/components/common/DaterangePickerWithPresets.tsx`
- Uses **react-day-picker v9** — `onSelect` (not `onDayClick`), `autoFocus` (not `initialFocus`), `DateRange` type from `react-day-picker`.
- Preset constants by card:
  | Card | Constant |
  |---|---|
  | MoneyFlow | `MONEYFLOW_PRESETS` |
  | CategoriesTimeline | `CATEGORIES_TIMELINE_PRESETS` |
  | DistributionDonut | `DISTRIBUTION_PRESETS` |
  | Dashboard / default | `DASHBOARD_TIMEFRAME_OPTIONS` |
  | Transaction filters | `FILTER_PRESETS` |
- All preset constants live in `src/constants/datetime.ts`. Type: `PresetOption = { label: string; range: Timeframe }`.

---

## Known Issues / Technical Debt

- **`@typescript-eslint/no-explicit-any` warnings** — rule is set to `warn`; resolve existing `any` usages incrementally
- **`knip.json` entry pattern** — `"src/**/*.{ts,tsx}"` treats every file as an entry point, so knip cannot detect unused files. Tighten to only real entry points when feasible
- **Unused packages** — `pnpm knip` reports several unused dependencies (e.g. `@hello-pangea/dnd`, `framer-motion`, `react-d3-tree`). Review before removing — some may be used via dynamic imports or in example files
- **Vite pre-bundle cache** — after upgrading packages, stale cache can cause false "not exported" errors. Fix: `rm -rf node_modules/.vite` then restart dev server.
