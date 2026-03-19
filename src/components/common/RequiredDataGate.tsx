import React from 'react';

import BootScreen from '@/components/layout/BootScreen';
import InitErrorScreen from '@/components/layout/InitErrorScreen';
import { useRequiredData } from '@/hooks/useRequiredData';

export const RequiredDataGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { entries, isLoading, hasError, retry } = useRequiredData();

  if (hasError) return <InitErrorScreen entries={entries} onRetry={retry} />;
  if (isLoading) return <BootScreen entries={entries} />;

  return <>{children}</>;
};

export default RequiredDataGate;
