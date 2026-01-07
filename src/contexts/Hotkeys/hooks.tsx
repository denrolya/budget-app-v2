import { useContext } from 'react';

import { HotkeysContext } from './context';

export const useHotkeys = () => {
  const context = useContext(HotkeysContext);
  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeysProvider');
  }
  return context;
};
