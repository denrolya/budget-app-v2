# Budget

> Personal finance terminal — multi-currency ledger, live exchange rates, bank webhook integrations, and a mobile-first PWA. Self-hosted, single-user.

The frontend is a React SPA that talks to [budget-api](https://github.com/denrolya/budget-api) (Symfony 6 + API Platform). All data lives on your own server.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Mobile / PWA](#mobile--pwa)
- [Deployment](#deployment)
- [Scripts Reference](#scripts-reference)
- [Code Standards](#code-standards)

---

## Features

### Core

| Feature             | Description                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ledger**          | Unified timeline of transactions and transfers. Date-grouped, filterable by account, category, amount, note, currency, and draft status. Heatmap overlay for visual activity patterns. |
| **Accounts**        | Bank, cash, internet, and basic accounts. Multi-currency. Balance history chart. Live bank integrations via Monobank and Wise webhooks.                                                |
| **Transfers**       | Cross-account and cross-currency transfers with exchange rate tracking.                                                                                                                |
| **Categories**      | Hierarchical income/expense category tree with profit-affecting flag.                                                                                                                  |
| **Debts**           | Track money owed to and from others. Timeline, balance chart, and history log.                                                                                                         |
| **Statistics**      | MoneyFlow (income vs expense over time), category distribution donut, categories timeline, and per-account balance history.                                                            |
| **Budget Planning** | Monthly budget lines per category with vs-actual comparison.                                                                                                                           |
| **Buckets**         | Drag-and-drop allocation of account balances into purpose buckets (emergency fund, investments, goals, etc.) with a 10-rule financial health score (A–F).                              |
| **Exchange Rates**  | Live rates from three sources: Fixer, Monobank, and Wise. Currency converter built in. 1-hour client-side cache.                                                                       |

### Bank Integrations

Monobank and Wise send transaction webhooks to the backend the moment a card is swiped. The backend parses, deduplicates, auto-categorises, and enriches each transaction (merchant name, exchange rate) before it appears in the ledger as a draft for review.

### Mobile PWA

A separate mobile-optimised view at `/m` — installable as a standalone app. See [Mobile / PWA](#mobile--pwa).

### UX

- Trading-terminal design language — monospace labels, compact controls, semantic colour tokens
- Fullscreen ledger mode
- Keyboard shortcuts and command palette
- Light / Dark / Tron Dark themes
- Offline-capable (Workbox precaching + network-first API caching)

---

## Tech Stack

| Concern       | Library                         |
| ------------- | ------------------------------- |
| Framework     | React 18 + TypeScript (strict)  |
| Build         | Vite 6                          |
| Server state  | TanStack Query v5               |
| Routing       | React Router v6                 |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling       | Tailwind CSS v3                 |
| Charts        | Nivo, Recharts                  |
| Forms         | React Hook Form + Zod           |
| Drag and drop | dnd-kit                         |
| Dates         | Moment.js                       |
| HTTP          | Axios                           |
| PWA           | vite-plugin-pwa + Workbox       |
| Testing       | Vitest + Testing Library        |
| Linting       | ESLint + Prettier               |

---

## Architecture

### Project layout

```
src/
  features/{feature}/       # Vertical feature slices
    api/
      keys.ts               # Query key factories
      service.ts            # Pure async API calls (no React)
      queries.ts            # useQuery hooks
      mutations.ts          # useMutation hooks, exported via useMutations()
    components/             # Feature-scoped components
    hooks/                  # Feature-scoped hooks
    models/                 # Domain classes + raw API interfaces
    routes/                 # Page (route) components
    types.ts                # DTOs, enums, domain interfaces
    index.ts                # Public barrel export

  components/
    common/                 # Shared reusable components
    layout/                 # App shell and layout components
    ui/                     # shadcn/ui primitives (do not modify)

  hooks/                    # Global hooks (useIsMobile, ...)
  services/api.ts           # Axios instance (auth interceptors, base URL)
  constants/                # App-wide constants
  contexts/                 # React contexts (Auth, Form, Theme, ...)
  lib/                      # Pure utility functions
  assets/styles/            # Global CSS, theme variables
```

### Data flow

```
AuthProvider (JWT → localStorage)
  └── RequireAuth
        └── RequiredDataGate          ← waits for exchange rates + accounts + categories + debts
              ├── AppShell  (/*)      ← desktop layout (CommandBar, Statusline)
              └── MobileApp (/m/*)   ← mobile layout (MobileShell, bottom nav)
```

`RequiredDataGate` blocks rendering until the four foundational queries resolve. Once loaded, all data is available through lightweight selector hooks (`useAccounts`, `useExchangeRates`, `useTotalBalance`, etc.) without prop-drilling.

### API layer pattern

Every feature's `api/` folder follows a strict four-file layout:

```ts
// keys.ts — stable query key factories
export const queryKeys = {
  all: ['accounts'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
};

// service.ts — pure async functions, no hooks
export const accountService = {
  async fetchList(rates: ExchangeRates): Promise<Account[]> { ... },
};

// queries.ts — useQuery hooks
export const useList = () =>
  useQuery({ queryKey: queryKeys.list(), queryFn: () => accountService.fetchList(...) });

// mutations.ts — all mutations in one hook
export const useMutations = () => {
  const create = useMutation({ ... });
  return { create: create.mutateAsync, isCreating: create.isPending };
};
```

### Exchange rates

Rates are fetched from three independent sources on app load and cached for 1 hour. Each source returns a `Record<CURRENCY_CODE, number>` keyed against EUR as the base. Account `convertedValues` are pre-computed server-side and attached to each account response — no client-side conversion needed for balance display.

### Key hook: `useLedger`

`useLedger` is the central hook for any transaction+transfer listing. It owns timeframe state, filters, pagination, sort order, and visibility toggles. It is consumed by `LedgerActivityCard` (a generic card wrapper used on the Ledger page, Account detail, and Debt detail) and directly by `MobileLedgerPage`.

---

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm v9+
- A running [budget-api](https://github.com/denrolya/budget-api) backend

### Setup

```bash
# 1. Clone and install
git clone https://github.com/denrolya/budget-app.git
cd budget-app/frontend
pnpm install

# 2. Configure environment
cp .env.dist .env
# Edit .env — set VITE_API_URL to your backend URL

# 3. Start dev server (http://localhost:5173)
pnpm dev
```

---

## Environment Variables

Copy `.env.dist` to `.env` and fill in the values. Never commit `.env`.

| Variable            | Required    | Description                                                                 |
| ------------------- | ----------- | --------------------------------------------------------------------------- |
| `VITE_API_URL`      | ✅          | Backend base URL, e.g. `https://api.example.com/`. Trailing slash required. |
| `VITE_STORAGE_TYPE` | ✅          | Always `localStorage`.                                                      |
| `DEPLOY_HOST`       | Deploy only | SSH hostname for `pnpm deploy`.                                             |
| `DEPLOY_USER`       | Deploy only | SSH user for `pnpm deploy`.                                                 |
| `DEPLOY_BASE`       | Deploy only | Absolute path on server, e.g. `/var/www/app-v2`.                            |
| `DEPLOY_KEEP`       | Deploy only | Number of releases to keep on server (default: 5).                          |
| `SONAR_USER_TOKEN`  | CI only     | Token for `pnpm sonar:scan`.                                                |

---

## Mobile / PWA

The app ships a dedicated mobile view at `/m` with four screens: Balances, Ledger, Rates, and Converter. It is built as a separate route group with standalone components — it does not share the desktop layout.

### Installing to homescreen

**Android (Chrome):** open the app → browser menu → _Add to Home Screen_. The app opens at `/m` in standalone mode.

**iOS (Safari):** open the app → Share → _Add to Home Screen_.

### Offline support

Workbox is configured with:

- **Precache** — all Vite-emitted assets are cached at install time
- **Network-first** (5s timeout) for all `/api/*` requests — fresh data preferred, last cached response as fallback
- **Stale-while-revalidate** for fonts and images

---

## Deployment

Releases are managed by `deploy.mjs` — a zero-dependency Node script that builds, rsyncs to the server, and atomically switches a `current` symlink. The server runs nginx serving the static build.

### Server layout

```
/var/www/app-v2/
  releases/
    20260307_160000/    ← previous
    20260307_174500/    ← current (live)
  current -> releases/20260307_174500
```

### Commands

```bash
# Build locally + upload + go live
pnpm deploy

# Upload only (re-uses existing dist/, skips build)
pnpm deploy:upload

# Roll back to previous release (or N releases back)
pnpm deploy:rollback
pnpm deploy:rollback 2

# Tail nginx logs on the server
pnpm deploy:logs

# Open SSH shell on the server
pnpm deploy:shell

# Test / reload nginx config
pnpm deploy:nginx:test
pnpm deploy:nginx:reload
```

### nginx config (minimal)

```nginx
server {
    listen 443 ssl;
    server_name app.example.com;

    root /var/www/app-v2/current;
    index index.html;

    # SPA fallback — all unknown paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-lived cache for Vite-hashed assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker must not be cached
    location /sw.js {
        expires off;
        add_header Cache-Control "no-store";
    }
}
```

---

## Scripts Reference

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `pnpm dev`             | Start Vite dev server on `http://localhost:5173` |
| `pnpm build`           | Type-check + production build to `dist/`         |
| `pnpm build:dev`       | Production build without type-check (faster)     |
| `pnpm preview`         | Serve the `dist/` build locally                  |
| `pnpm lint`            | Run ESLint                                       |
| `pnpm lint:fix`        | Run ESLint with auto-fix                         |
| `pnpm lint:ts`         | Type-check only (no emit)                        |
| `pnpm format`          | Check formatting with Prettier                   |
| `pnpm format:fix`      | Auto-format with Prettier                        |
| `pnpm test`            | Run Vitest in watch mode                         |
| `pnpm test:ui`         | Open Vitest browser UI                           |
| `pnpm test:coverage`   | Run tests with coverage report                   |
| `pnpm knip`            | Find unused exports and files                    |
| `pnpm deploy`          | Full deploy: build → upload → go live            |
| `pnpm deploy:rollback` | Roll back to previous release                    |
| `pnpm sonar:scan`      | Run SonarQube static analysis                    |

---

## Code Standards

Full code style guide, naming conventions, component patterns, API layer rules, and design system documentation live in [CLAUDE.md](./CLAUDE.md).

Key rules at a glance:

- `strict: true` TypeScript — no escape hatches
- `noUnusedLocals` / `noUnusedParameters` enforced at compile time
- No ternaries in JSX render — use variables or early returns
- Semantic colour tokens only — never hardcoded Tailwind palette colours
- Feature-sliced architecture — cross-feature code only in `components/common/`, `hooks/`, or `lib/`
- Props sorted alphabetically (enforced by ESLint perfectionist plugin)
