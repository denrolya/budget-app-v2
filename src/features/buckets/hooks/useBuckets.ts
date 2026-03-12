import { useCallback, useMemo, useState } from 'react';

import { useBaseCurrency } from '@/features/auth';
import type Account from '@/features/accounts/models/Account';
import { useActiveAccounts } from '@/hooks/financeData';

import { PRESET_BUCKETS, STORAGE_KEY, STRONG_CURRENCIES } from '../constants';
import { type AllocationMap, type BucketEntry, type BucketsConfig, type UnassignedEntry } from '../models/types';

const DEFAULT_CONFIG: BucketsConfig = {
  version: 2,
  buckets: PRESET_BUCKETS,
  allocationMap: {},
  monthlyExpenses: null,
  visualization: 'treemap',
};

const loadConfig = (): BucketsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (parsed.version !== 2) return DEFAULT_CONFIG;

    const allocationMap = (parsed.allocationMap as AllocationMap) ?? {};
    // Detect old percentage-based v2 data — reset allocationMap (amounts can't be inferred)
    const firstShare = Object.values(allocationMap)[0]?.[0] as unknown as Record<string, unknown> | undefined;
    if (firstShare && 'percentage' in firstShare) {
      return {
        ...DEFAULT_CONFIG,
        ...(parsed as Partial<BucketsConfig>),
        allocationMap: {},
      };
    }

    return {
      ...DEFAULT_CONFIG,
      ...(parsed as Partial<BucketsConfig>),
      buckets:
        Array.isArray(parsed.buckets) && (parsed.buckets as unknown[]).length > 0
          ? (parsed.buckets as BucketsConfig['buckets'])
          : PRESET_BUCKETS,
      allocationMap,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

const persist = (config: BucketsConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

const sumAllocated = (accountId: number, allocationMap: AllocationMap): number => {
  return (allocationMap[accountId] ?? []).reduce((s, sh) => s + sh.amount, 0);
}

export const useBuckets = () => {
  const [config, setConfig] = useState<BucketsConfig>(loadConfig);
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();

  const update = useCallback((updater: (prev: BucketsConfig) => BucketsConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  // ── Derived: entries per bucket ─────────────────────────────────────────────

  const entriesByBucket = useMemo<Record<string, BucketEntry[]>>(() => {
    const map: Record<string, BucketEntry[]> = {};
    for (const b of config.buckets) map[b.id] = [];

    for (const account of accounts) {
      const available = Math.max(0, account.balance);
      const convertedFull = account.convertedValues?.[baseCurrency] ?? 0;
      const shares = config.allocationMap[account.id] ?? [];
      const totalAllocated = shares.reduce((s, sh) => s + sh.amount, 0);

      for (const share of shares) {
        if (!map[share.bucketId]) continue;
        const allocatedBalance = available > 0 ? convertedFull * (share.amount / available) : 0;
        const maxAmount = Math.max(share.amount, available - (totalAllocated - share.amount));
        map[share.bucketId].push({
          account,
          amount: share.amount,
          allocatedBalance,
          maxAmount,
        });
      }
    }
    return map;
  }, [accounts, config.allocationMap, config.buckets, baseCurrency]);

  // ── Derived: unassigned entries ─────────────────────────────────────────────

  const unassignedEntries = useMemo<UnassignedEntry[]>(
    () =>
      accounts
        .map((account) => {
          const available = Math.max(0, account.balance);
          const allocated = sumAllocated(account.id, config.allocationMap);
          const unallocatedAmount = Math.max(0, available - allocated);
          const convertedFull = account.convertedValues?.[baseCurrency] ?? 0;
          const unallocatedBalance = available > 0 ? convertedFull * (unallocatedAmount / available) : 0;
          return {
            account,
            unallocatedAmount,
            unallocatedBalance,
            isPartial: allocated > 0 && unallocatedAmount > 0,
          };
        })
        .filter((e) => e.unallocatedAmount > 0),
    [accounts, config.allocationMap, baseCurrency],
  );

  // ── Derived: bucket balances ────────────────────────────────────────────────

  const bucketBalances = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const b of config.buckets) map[b.id] = 0;
    for (const [id, entries] of Object.entries(entriesByBucket)) {
      map[id] = entries.reduce((s, e) => s + e.allocatedBalance, 0);
    }
    return map;
  }, [config.buckets, entriesByBucket]);

  // ── Derived: health-related account metrics ─────────────────────────────────

  const strongCurrencyBalance = useMemo(
    () =>
      accounts
        .filter((a) => STRONG_CURRENCIES.has(a.currency))
        .reduce((s, a) => s + Math.max(0, a.convertedValues?.[baseCurrency] ?? 0), 0),
    [accounts, baseCurrency],
  );

  const maxSingleAccountBalance = useMemo(
    () => Math.max(0, ...accounts.map((a) => a.convertedValues?.[baseCurrency] ?? 0)),
    [accounts, baseCurrency],
  );

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + Math.max(0, a.convertedValues?.[baseCurrency] ?? 0), 0),
    [accounts, baseCurrency],
  );

  const unassignedBalance = useMemo(
    () => unassignedEntries.reduce((s, e) => s + e.unallocatedBalance, 0),
    [unassignedEntries],
  );

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Allocate the remaining unallocated balance of an account to a bucket */
  const allocateRemainder = useCallback(
    (accountId: number, bucketId: string) => {
      update((prev) => {
        const account = accounts.find((a) => a.id === accountId);
        if (!account) return prev;
        const available = Math.max(0, account.balance);
        const existing = prev.allocationMap[accountId] ?? [];
        const allocated = existing.reduce((s, sh) => s + sh.amount, 0);
        const remaining = available - allocated;
        if (remaining <= 0) return prev;

        const idx = existing.findIndex((s) => s.bucketId === bucketId);
        const updated =
          idx >= 0
            ? existing.map((s, i) => (i === idx ? { ...s, amount: s.amount + remaining } : s))
            : [...existing, { bucketId, amount: remaining }];
        return { ...prev, allocationMap: { ...prev.allocationMap, [accountId]: updated } };
      });
    },
    [update, accounts],
  );

  /** Remove all allocation for an account from a specific bucket */
  const removeAllocation = useCallback(
    (accountId: number, bucketId: string) => {
      update((prev) => {
        const updated = (prev.allocationMap[accountId] ?? []).filter((s) => s.bucketId !== bucketId);
        const next = { ...prev.allocationMap };
        if (updated.length === 0) delete next[accountId];
        else next[accountId] = updated;
        return { ...prev, allocationMap: next };
      });
    },
    [update],
  );

  /** Move an allocation from one bucket to another */
  const moveAllocation = useCallback(
    (accountId: number, fromBucketId: string, toBucketId: string) => {
      update((prev) => {
        const existing = prev.allocationMap[accountId] ?? [];
        const fromShare = existing.find((s) => s.bucketId === fromBucketId);
        if (!fromShare) return prev;

        const withoutFrom = existing.filter((s) => s.bucketId !== fromBucketId);
        const toIdx = withoutFrom.findIndex((s) => s.bucketId === toBucketId);
        const updated =
          toIdx >= 0
            ? withoutFrom.map((s, i) => (i === toIdx ? { ...s, amount: s.amount + fromShare.amount } : s))
            : [...withoutFrom, { bucketId: toBucketId, amount: fromShare.amount }];

        return { ...prev, allocationMap: { ...prev.allocationMap, [accountId]: updated } };
      });
    },
    [update],
  );

  /** Set the allocation amount for a specific account+bucket. Clamped to available space. */
  const setAllocationAmount = useCallback(
    (accountId: number, bucketId: string, newAmount: number) => {
      update((prev) => {
        const account = accounts.find((a) => a.id === accountId);
        if (!account) return prev;
        const available = Math.max(0, account.balance);
        const existing = prev.allocationMap[accountId] ?? [];
        const otherTotal = existing.filter((s) => s.bucketId !== bucketId).reduce((s, sh) => s + sh.amount, 0);
        const clamped = Math.max(0, Math.min(available - otherTotal, Math.round(newAmount)));

        if (clamped === 0) {
          const updated = existing.filter((s) => s.bucketId !== bucketId);
          const next = { ...prev.allocationMap };
          if (updated.length === 0) delete next[accountId];
          else next[accountId] = updated;
          return { ...prev, allocationMap: next };
        }

        const idx = existing.findIndex((s) => s.bucketId === bucketId);
        const updated =
          idx >= 0
            ? existing.map((s, i) => (i === idx ? { ...s, amount: clamped } : s))
            : [...existing, { bucketId, amount: clamped }];
        return { ...prev, allocationMap: { ...prev.allocationMap, [accountId]: updated } };
      });
    },
    [update, accounts],
  );

  const setBucketTarget = useCallback(
    (bucketId: string, amount: number | null) =>
      update((prev) => ({
        ...prev,
        buckets: prev.buckets.map((b) => (b.id === bucketId ? { ...b, targetAmount: amount } : b)),
      })),
    [update],
  );

  const setMonthlyExpenses = useCallback(
    (value: number | null) => update((prev) => ({ ...prev, monthlyExpenses: value })),
    [update],
  );

  const setVisualization = useCallback(
    (viz: BucketsConfig['visualization']) => update((prev) => ({ ...prev, visualization: viz })),
    [update],
  );

  const exportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buckets-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const importConfig = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as Partial<BucketsConfig>;
        if (parsed.version === 2 && Array.isArray(parsed.buckets)) {
          const imported: BucketsConfig = { ...DEFAULT_CONFIG, ...(parsed as BucketsConfig) };
          setConfig(imported);
          persist(imported);
        }
      } catch {
        // invalid JSON — ignore
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    config,
    buckets: config.buckets,
    entriesByBucket,
    unassignedEntries,
    bucketBalances,
    baseCurrency,
    totalBalance,
    unassignedBalance,
    strongCurrencyBalance,
    maxSingleAccountBalance,
    allocateRemainder,
    removeAllocation,
    moveAllocation,
    setAllocationAmount,
    setBucketTarget,
    setMonthlyExpenses,
    setVisualization,
    exportConfig,
    importConfig,
  };
}

export type { Account };
