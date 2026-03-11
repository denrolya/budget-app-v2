import React, { createContext, useContext, useMemo, useState } from 'react';

interface PageHeaderContextValue {
  title: React.ReactNode;
  setTitle: (title: React.ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

export const PageHeaderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [title, setTitle] = useState<React.ReactNode>(null);

  const value = useMemo(
    () => ({
      title,
      setTitle,
    }),
    [title],
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
};

export const usePageHeader = (): PageHeaderContextValue => {
  const context = useContext(PageHeaderContext);
  if (!context) throw new Error('usePageHeader must be used within a PageHeaderProvider');
  return context;
};

export const usePageHeaderTitle = (title: React.ReactNode) => {
  const { setTitle } = usePageHeader();

  React.useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);
};
