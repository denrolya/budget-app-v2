# Budget App — Frontend

Personal finance management application built with **React 18**, **TypeScript**, and **Vite**.

## Tech Stack

- **React 18** + **TypeScript** (strict)
- **Vite** — build tool and dev server
- **TanStack Query v5** — server state, caching, mutations
- **shadcn/ui** + **Tailwind CSS** — component library and styling
- **Nivo** — data visualization (bar, pie, treemap, heatmap)
- **dnd-kit** — drag-and-drop (Buckets page)
- **Moment.js** — date/time handling
- **Axios** — HTTP client
- **Vitest** + **Testing Library** — unit and integration tests

## Requirements

- Node.js v18+
- pnpm v9+

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:5173)
pnpm dev

# Type-check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build for production
pnpm build
```

## Testing

```bash
# Run tests
pnpm test

# Interactive UI
pnpm test:ui

# Coverage report
pnpm test:coverage
```

## Features

- **Transactions** — create, edit, bulk-import incomes and expenses with inline editing
- **Transfers** — track money movements between accounts with exchange rate tracking
- **Accounts** — manage bank, cash, internet, and crypto accounts; bank integration via Wise / Monobank webhooks
- **Categories** — hierarchical category tree with income/expense split
- **Debts** — track money owed to and from others
- **Statistics** — money flow charts, category distribution donuts, timeline charts, balance history
- **Buckets** — allocate account balances into purpose buckets (emergency fund, investments, etc.) with health scoring
- **Ledger** — unified transactions + transfers timeline view
- **Exchange Rates** — live rates via Fixer, Monobank, and Wise APIs with currency conversion
- **Dark Mode** — system-aware with manual override (Tron theme included)
- **PWA** — installable, offline-capable
- **Command Palette** — keyboard-driven navigation
- **Hotkeys** — configurable keyboard shortcuts

## Code Standards

See [CLAUDE.md](./CLAUDE.md) for the full code style guide, naming conventions, architecture rules, and API layer patterns.
