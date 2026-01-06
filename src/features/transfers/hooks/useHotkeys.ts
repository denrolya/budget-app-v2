import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';

export const useListHotkeys = ({
  onPrevPage,
  onNextPage,
  onFiltersToggle,
}: {
  onPrevPage: () => void;
  onNextPage: () => void;
  onFiltersToggle: () => void;
}) => {
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  useHotkeys('arrowleft', onPrevPage);
  useHotkeys('arrowright', onNextPage);
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
        windows: 'F',
        mac: 'F',
        description: 'Toggle Filters Dialog',
      },
    ];
    addPageHotkeys('Transfer List', hotkeys);

    return () => {
      removePageHotkeys('Transfer List');
    };
  }, [addPageHotkeys, removePageHotkeys]);
};
