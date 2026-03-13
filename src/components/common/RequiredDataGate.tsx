import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import React, { useMemo } from 'react';

import MainLoadingScreen from '@/components/layout/MainLoadingScreen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { queryKeys as accountsQueryKey, useList as useAccountsQuery } from '@/features/accounts';
import { queryKeys as categoriesQueryKey, useList as useCategoriesQuery } from '@/features/categories';
import { queryKeys as debtsQueryKey, useList as useDebtsQuery } from '@/features/debts';
import { exchangeRatesQueryKey, useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

export const RequiredDataGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const qc = useQueryClient();

  const rates = useExchangeRatesQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const debts = useDebtsQuery();

  const isLoading = rates.isLoading || accounts.isLoading || categories.isLoading || debts.isLoading;
  const error = rates.error || accounts.error || categories.error || debts.error;

  const progress = useMemo(() => {
    const done = [rates, accounts, categories, debts].filter((q) => q.isSuccess).length;
    return (done / 4) * 100;
  }, [rates, accounts, categories, debts]);

  const retry = () => {
    void qc.invalidateQueries({ queryKey: exchangeRatesQueryKey });
    void qc.invalidateQueries({ queryKey: accountsQueryKey.all });
    void qc.invalidateQueries({ queryKey: categoriesQueryKey.all });
    void qc.invalidateQueries({ queryKey: debtsQueryKey.all });
  };

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading required data</AlertTitle>
        <AlertDescription>
          Failed to load reference data (accounts/categories/debts/rates).
          <Button size="sm" variant="outline" className="mt-2" onClick={retry}>
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) return <MainLoadingScreen progress={progress} />;

  return <>{children}</>;
};

export default RequiredDataGate;
