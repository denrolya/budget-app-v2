import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
export const useLedgerHotkeys = ({
  onPrev,
  onNext,
  toggleFilters,
  toggleBulkCreate,
}: {
  onPrev: () => void;
  onNext: () => void;
  toggleFilters: () => void;
  toggleBulkCreate: () => void;
}) => {
  useHotkeys('arrowleft', onPrev);
  useHotkeys('arrowright', onNext);
  useHotkeys('b', toggleBulkCreate);
  useHotkeys('f', toggleFilters);

  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  useEffect(() => {
    const hotkeys = [
      { windows: 'ArrowLeft', mac: 'ArrowLeft', description: 'Go to previous period' },
      { windows: 'ArrowRight', mac: 'ArrowRight', description: 'Go to next period' },
      { windows: 'B', mac: 'B', description: 'Toggle Bulk Create' },
      { windows: 'F', mac: 'F', description: 'Toggle Filters Dialog' },
    ];
    addPageHotkeys('Daily Ledger', hotkeys);
    return () => removePageHotkeys('Daily Ledger');
  }, [addPageHotkeys, removePageHotkeys]);
};
