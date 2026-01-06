import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
export const useListHotkeys = ({
  onPrevPage,
  onNextPage,
  onFiltersToggle,
  onBulkCreateToggle,
}: {
  onPrevPage: () => void;
  onNextPage: () => void;
  onFiltersToggle: () => void;
  onBulkCreateToggle: () => void;
}) => {
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();
  useHotkeys('arrowleft', onPrevPage);
  useHotkeys('arrowright', onNextPage);
  useHotkeys('b', onBulkCreateToggle);
  useHotkeys('f', onFiltersToggle);

  useEffect(() => {
    const hotkeys = [
      {
        windows: 'ArrowLeft',
        mac: 'ArrowLeft',
        description: 'Go to previous page',
      },
      {
        windows: 'ArrowRight',
        mac: 'ArrowRight',
        description: 'Go to next page',
      },
      {
        windows: 'B',
        mac: 'B',
        description: 'Toggle Bulk Create',
      },
      {
        windows: 'F',
        mac: 'F',
        description: 'Toggle Filters Dialog',
      },
    ];
    addPageHotkeys('Transactions List', hotkeys);

    return () => {
      removePageHotkeys('Transactions List');
    };
  }, [addPageHotkeys, removePageHotkeys]);
};
