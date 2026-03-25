import debounce from 'lodash/debounce';
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@/constants/ui';
import { type TransactionFilters } from '@/features/transactions';
import { type TransferFilters } from '@/features/transfers';
import { type Timeframe } from '@/types/global';

import { type ViewMode } from '../types';

const AMOUNT_DEBOUNCE_MS = 350;

interface UseFilterInputsConfig {
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  showTransactions: boolean;
  showTransfers: boolean;
  setFilter: (key: string, value: unknown) => void;
  setShowTransactions: (value: boolean) => void;
  setShowTransfers: (value: boolean) => void;
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
}

export const useFilterInputs = ({
  transactionFilters,
  transferFilters,
  showTransactions,
  showTransfers,
  setFilter,
  setShowTransactions,
  setShowTransfers,
  timeframe,
  setTimeframe,
}: UseFilterInputsConfig) => {
  // ─ Local controlled state for debounced inputs ──────────────────────────
  const [minLocal, setMinLocal] = useState('');
  const [maxLocal, setMaxLocal] = useState('');
  const [searchLocal, setSearchLocal] = useState(transactionFilters.searchTerm ?? '');

  // ─ Debounced callbacks ──────────────────────────────────────────────────
  const debouncedAmount = useRef(
    debounce((minStr: string, maxStr: string) => {
      const min = minStr === '' ? NaN : Number(minStr);
      const max = maxStr === '' ? NaN : Number(maxStr);
      if (!Number.isFinite(min) && !Number.isFinite(max)) {
        setFilter('amountRange', []);
        return;
      }
      setFilter('amountRange', [min, max]);
    }, AMOUNT_DEBOUNCE_MS),
  ).current;

  const debouncedSearch = useRef(
    debounce((value: string) => setFilter('searchTerm', value), SEARCH_DEBOUNCE_MS),
  ).current;

  useEffect(
    () => () => {
      debouncedAmount.cancel();
      debouncedSearch.cancel();
    },
    [debouncedAmount, debouncedSearch],
  );

  // ─ Sync external filter state → local inputs ───────────────────────────
  useEffect(() => {
    const [extMin, extMax] = transactionFilters.amountRange ?? [];
    setMinLocal((p) => {
      const n = extMin != null && Number.isFinite(extMin) ? String(extMin) : '';
      return p === n ? p : n;
    });
    setMaxLocal((p) => {
      const n = extMax != null && Number.isFinite(extMax) ? String(extMax) : '';
      return p === n ? p : n;
    });
  }, [transactionFilters.amountRange]);

  useEffect(() => {
    setSearchLocal(transactionFilters.searchTerm ?? '');
  }, [transactionFilters.searchTerm]);

  // ─ Change handlers ──────────────────────────────────────────────────────
  const handleMinChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setMinLocal(e.target.value);
      debouncedAmount(e.target.value, maxLocal);
    },
    [debouncedAmount, maxLocal],
  );

  const handleMaxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setMaxLocal(e.target.value);
      debouncedAmount(minLocal, e.target.value);
    },
    [debouncedAmount, minLocal],
  );

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchLocal(e.target.value);
      debouncedSearch(e.target.value);
    },
    [debouncedSearch],
  );

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? range.after.clone().startOf('day') : timeframe.after,
        before: range.before ? range.before.clone().endOf('day') : timeframe.before,
      });
    },
    [setTimeframe, timeframe],
  );

  // ─ Derived values ───────────────────────────────────────────────────────
  const accountsValue = [
    ...new Set([
      ...(Array.isArray(transactionFilters.accounts) ? transactionFilters.accounts : []),
      ...(Array.isArray(transferFilters.accounts) ? transferFilters.accounts : []),
    ]),
  ];

  const selectedCurrencies: string[] = transactionFilters.currencies ?? [];

  const viewMode: ViewMode =
    showTransactions && !showTransfers ? 'transactions' : !showTransactions && showTransfers ? 'transfers' : 'both';

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setShowTransactions(mode !== 'transfers');
      setShowTransfers(mode !== 'transactions');
    },
    [setShowTransactions, setShowTransfers],
  );

  const toggleNestedCategories = useCallback(() => {
    setFilter('withNestedCategories', !transactionFilters.withNestedCategories);
  }, [setFilter, transactionFilters.withNestedCategories]);

  return {
    // Controlled input values
    minLocal,
    maxLocal,
    searchLocal,
    // Change handlers
    handleMinChange,
    handleMaxChange,
    handleSearchChange,
    handleTimeframeChange,
    // Derived
    accountsValue,
    selectedCurrencies,
    viewMode,
    setViewMode,
    toggleNestedCategories,
  };
};
