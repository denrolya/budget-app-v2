import React, { createContext, useContext, useMemo, useState } from 'react';

interface PageHeaderContextValue {
  title: React.ReactNode;
  setTitle: (title: React.ReactNode) => void;
  headerSlot: React.ReactNode;
  setHeaderSlot: (slot: React.ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

export const PageHeaderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [title, setTitle] = useState<React.ReactNode>(null);
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);

  const value = useMemo(
    () => ({
      title,
      setTitle,
      headerSlot,
      setHeaderSlot,
    }),
    [title, headerSlot],
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePageHeader = (): PageHeaderContextValue => {
  const context = useContext(PageHeaderContext);
  if (!context) throw new Error('usePageHeader must be used within a PageHeaderProvider');
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePageHeaderTitle = (title: React.ReactNode) => {
  const { setTitle } = usePageHeader();

  React.useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);
};

/** Inject arbitrary ReactNode into the main header's center slot. Cleaned up on unmount. */
// eslint-disable-next-line react-refresh/only-export-components
export const usePageHeaderSlot = (slot: React.ReactNode) => {
  const { setHeaderSlot } = usePageHeader();

  React.useEffect(() => {
    setHeaderSlot(slot);
    return () => setHeaderSlot(null);
  }, [setHeaderSlot, slot]);
};
