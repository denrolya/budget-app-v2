import React, { createContext, useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useHotkeys as useReactHotkeysHook } from 'react-hotkeys-hook';

import { CommandPalette } from '@/components/common/CommandPalette';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import type { Hotkey, HotkeyCategory, HotkeysContextType } from '@/types/hotkeys';

// eslint-disable-next-line react-refresh/only-export-components
export const HotkeysContext = createContext<HotkeysContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const navigationHotkeys: Hotkey[] = [
  { windows: '⇧⇧', mac: '⇧⇧', description: 'Open/Close Commands' },
  { windows: '1', mac: '1', description: 'Go to Ledger' },
  { windows: '2', mac: '2', description: 'Go to Accounts' },
  { windows: '3', mac: '3', description: 'Go to Debts' },
  { windows: '4', mac: '4', description: 'Go to Budget' },
  { windows: '5', mac: '5', description: 'Go to Buckets' },
  { windows: '6', mac: '6', description: 'Go to Categories' },
  { windows: '7', mac: '7', description: 'Go to Dashboard' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const globalHotkeys: Hotkey[] = [
  { windows: 'Shift+A', mac: 'Shift+A', description: 'Open Account Form' },
  { windows: 'Shift+T', mac: 'Shift+T', description: 'Open Transaction Form' },
  { windows: 'Shift+R', mac: 'Shift+R', description: 'Open Transfer Form' },
  { windows: 'Shift+O', mac: 'Shift+O', description: 'Open Category Form' },
  { windows: 'Shift+D', mac: 'Shift+D', description: 'Open Debt Form' },
  { windows: 'Shift+B', mac: 'Shift+B', description: 'Open Bulk Create Transactions' },
  { windows: 'Shift+C', mac: 'Shift+C', description: 'Open Currency Converter' },
];

type HotkeysAction =
  | { type: 'ADD_PAGE_HOTKEYS'; payload: { pageName: string; hotkeys: Hotkey[] } }
  | { type: 'REMOVE_PAGE_HOTKEYS'; payload: { pageName: string } };

type HotkeysState = Record<string, HotkeyCategory>;

const hotkeysReducer = (state: HotkeysState, action: HotkeysAction): HotkeysState => {
  switch (action.type) {
    case 'ADD_PAGE_HOTKEYS': {
      const { pageName, hotkeys } = action.payload;

      const existing = state[pageName]?.hotkeys ?? null;
      if (existing && JSON.stringify(existing) === JSON.stringify(hotkeys)) return state;

      return {
        ...state,
        [pageName]: { name: pageName, hotkeys },
      };
    }

    case 'REMOVE_PAGE_HOTKEYS': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.payload.pageName]: _, ...rest } = state;
      return rest;
    }

    default:
      return state;
  }
};

export const HotkeysProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [pageHotkeys, dispatch] = useReducer(hotkeysReducer, {
    Global: { name: 'Global', hotkeys: globalHotkeys },
    Navigation: { name: 'Navigation', hotkeys: navigationHotkeys },
  });

  const [currentPage, setCurrentPage] = useState<string>('Global');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const { openForm } = useFormContext();

  const toggleHotkeysDialog = useCallback(() => setIsDialogOpen((prev) => !prev), []);
  const openHotkeysDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeHotkeysDialog = useCallback(() => setIsDialogOpen(false), []);

  // Double-shift detection
  const lastShiftRef = useRef<number>(0);

  const addPageHotkeys = useCallback((pageName: string, hotkeys: Hotkey[]) => {
    dispatch({ type: 'ADD_PAGE_HOTKEYS', payload: { pageName, hotkeys } });
  }, []);

  const removePageHotkeys = useCallback((pageName: string) => {
    if (pageName === 'Global') return;
    dispatch({ type: 'REMOVE_PAGE_HOTKEYS', payload: { pageName } });
  }, []);

  // Forms
  useReactHotkeysHook(
    'shift+t',
    (event) => {
      event.preventDefault();
      openForm(FormType.Transaction);
    },
    { preventDefault: true },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+r',
    (event) => {
      event.preventDefault();
      openForm(FormType.Transfer);
    },
    { preventDefault: true },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+a',
    (event) => {
      event.preventDefault();
      openForm(FormType.Account);
    },
    { preventDefault: true },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+o',
    (event) => {
      event.preventDefault();
      openForm(FormType.Category);
    },
    { preventDefault: true },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+d',
    (event) => {
      event.preventDefault();
      openForm(FormType.Debt);
    },
    { preventDefault: true },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+b',
    (event) => {
      event.preventDefault();
      openForm(FormType.BulkTransaction);
    },
    { preventDefault: true },
    [openForm],
  );

  // Double-shift opens command palette.
  // Ignore shift presses combined with Cmd/Ctrl/Alt so shortcuts like Cmd+Shift+Z
  // don't accidentally trigger the palette.
  useReactHotkeysHook(
    'shift',
    (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const now = Date.now();
      if (now - lastShiftRef.current < 400) {
        toggleHotkeysDialog();
        lastShiftRef.current = 0;
      } else {
        lastShiftRef.current = now;
      }
    },
    { preventDefault: false, keydown: true },
    [toggleHotkeysDialog],
  );

  const contextValue = useMemo<HotkeysContextType>(
    () => ({
      addPageHotkeys,
      removePageHotkeys,
      currentPage,
      setCurrentPage,
      openHotkeysDialog,
      closeHotkeysDialog,
      pageHotkeys,
    }),
    [addPageHotkeys, removePageHotkeys, currentPage, openHotkeysDialog, closeHotkeysDialog, pageHotkeys],
  );

  return (
    <HotkeysContext.Provider value={contextValue}>
      {children}
      <CommandPalette isOpen={isDialogOpen} onClose={closeHotkeysDialog} />
    </HotkeysContext.Provider>
  );
};
