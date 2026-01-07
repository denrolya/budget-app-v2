import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import CurrencyConverter from '@/components/common/CurrencyConverter';

type CurrencyConverterContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (next: boolean) => void;
};

const CurrencyConverterContext = createContext<CurrencyConverterContextValue | null>(null);

export const CurrencyConverterProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo<CurrencyConverterContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      setOpen: setIsOpen,
    }),
    [isOpen, open, close, toggle],
  );

  return (
    <CurrencyConverterContext.Provider value={value}>
      {children}

      {/* Single global mount point */}
      <CurrencyConverter open={isOpen} onOpenChange={setIsOpen} />
    </CurrencyConverterContext.Provider>
  );
};

export const useCurrencyConverter = (): CurrencyConverterContextValue => {
  const ctx = useContext(CurrencyConverterContext);
  if (!ctx) {
    throw new Error('useCurrencyConverter must be used within CurrencyConverterProvider');
  }
  return ctx;
};
