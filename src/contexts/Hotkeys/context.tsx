import React, { createContext, useCallback, useMemo, useReducer, useState } from 'react';
import { useHotkeys as useReactHotkeysHook } from 'react-hotkeys-hook';
import { useLocation, useNavigate } from 'react-router-dom';

import { HotkeysDialog } from '@/components/common/HotkeysDialog';
import { useSidebar } from '@/components/ui/sidebar';
import { ROUTES } from '@/constants/routes';
import { useFinanceData } from '@/contexts/FinanceData';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { Hotkey, HotkeyCategory, HotkeysContextType } from '@/types/hotkeys';

export const HotkeysContext = createContext<HotkeysContextType | null>(null);

export const navigationHotkeys: Hotkey[] = [
  { windows: 'S', mac: 'S', description: 'Open/Close Sidebar' },
  { windows: 'H', mac: 'H', description: 'Open/Close this window' },
  { windows: 'L', mac: 'L', description: 'Open Daily Ledger page' },
  { windows: 'T', mac: 'T', description: 'Open Transactions page' },
];

export const globalHotkeys: Hotkey[] = [
  { windows: 'Shift+A', mac: 'Shift+A', description: 'Open Account Form' },
  { windows: 'Shift+T', mac: 'Shift+T', description: 'Open Transaction Form' },
  { windows: 'Shift+R', mac: 'Shift+R', description: 'Open Transfer Form' },
  { windows: 'Shift+C', mac: 'Shift+C', description: 'Open Currency Converter' },
];

type HotkeysAction =
  | { type: 'ADD_PAGE_HOTKEYS'; payload: { pageName: string; hotkeys: Hotkey[] } }
  | { type: 'REMOVE_PAGE_HOTKEYS'; payload: { pageName: string } };

const hotkeysReducer = (
  state: { [key: string]: HotkeyCategory },
  action: HotkeysAction,
): { [key: string]: HotkeyCategory } => {
  switch (action.type) {
    case 'ADD_PAGE_HOTKEYS': {
      const { pageName, hotkeys } = action.payload;
      if (JSON.stringify(state[pageName]?.hotkeys) === JSON.stringify(hotkeys)) {
        return state; // No change, return the same state
      }
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
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const { openForm } = useFormContext();
  const { toggleCurrencyConverter } = useFinanceData();

  const toggleHotkeysDialog = useCallback(() => setIsDialogOpen((prev) => !prev), []);
  const openHotkeysDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeHotkeysDialog = useCallback(() => setIsDialogOpen(false), []);

  const addPageHotkeys = useCallback((pageName: string, hotkeys: Hotkey[]) => {
    dispatch({ type: 'ADD_PAGE_HOTKEYS', payload: { pageName, hotkeys } });
  }, []);

  const removePageHotkeys = useCallback((pageName: string) => {
    if (pageName === 'Global') return; // Prevent removing global hotkeys
    dispatch({ type: 'REMOVE_PAGE_HOTKEYS', payload: { pageName } });
  }, []);

  useReactHotkeysHook(
    'shift+t',
    (event) => {
      event.preventDefault();
      openForm(FormType.Transaction);
    },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+r',
    (event) => {
      event.preventDefault();
      openForm(FormType.Transfer);
    },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+a',
    (event) => {
      event.preventDefault();
      openForm(FormType.Account);
    },
    [openForm],
  );

  useReactHotkeysHook(
    'shift+c',
    (event) => {
      event.preventDefault();
      toggleCurrencyConverter();
    },
    [toggleCurrencyConverter],
  );

  useReactHotkeysHook(
    's',
    (event) => {
      event.preventDefault();
      toggleSidebar();
    },
    [toggleSidebar],
  );

  useReactHotkeysHook(
    'h',
    (event) => {
      event.preventDefault();
      toggleHotkeysDialog();
    },
    [toggleHotkeysDialog],
  );

  useReactHotkeysHook(
    'l',
    (event) => {
      event.preventDefault();
      if (location.pathname !== ROUTES.DAILY_LEDGER.path) {
        navigate(ROUTES.DAILY_LEDGER.path);
      }
    },
    [location.pathname, navigate],
  );

  useReactHotkeysHook(
    't',
    (event) => {
      event.preventDefault();
      if (location.pathname !== ROUTES.TRANSACTION_LIST.path) {
        navigate(ROUTES.TRANSACTION_LIST.path);
      }
    },
    [location.pathname, navigate],
  );

  const contextValue = useMemo(
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
      <HotkeysDialog isOpen={isDialogOpen} onClose={closeHotkeysDialog} />
    </HotkeysContext.Provider>
  );
};

export default HotkeysProvider;
