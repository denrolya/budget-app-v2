import { useCallback, useState } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { api } from '@/services/api';

import type { UseLedgerReturn } from './useLedger';

export const useExportCsv = (ledger: UseLedgerReturn) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      const { transactionFilters: filters, timeframe } = ledger;

      params.set('after', timeframe.after.format(BACKEND_DATE_FORMAT));
      params.set('before', timeframe.before.format(BACKEND_DATE_FORMAT));

      if (filters.type) params.set('type', filters.type);
      if (filters.searchTerm) params.set('note', filters.searchTerm);
      if (filters.isDraft !== undefined) params.set('isDraft', filters.isDraft ? '1' : '0');
      if (filters.withNestedCategories) params.set('withNestedCategories', '1');

      if (filters.accounts?.length) {
        for (const id of filters.accounts) params.append('accounts[]', String(id));
      }
      if (filters.categories?.length) {
        for (const id of filters.categories) params.append('categories[]', String(id));
      }
      if (filters.excludedCategories?.length) {
        for (const id of filters.excludedCategories) params.append('excludedCategories[]', String(id));
      }
      if (filters.currencies?.length) {
        for (const id of filters.currencies) params.append('currencies[]', id);
      }
      if (filters.debts?.length) {
        for (const id of filters.debts) params.append('debts[]', String(id));
      }
      if (filters.amountRange?.[0] !== undefined && !Number.isNaN(filters.amountRange[0])) {
        params.set('amount[gte]', String(filters.amountRange[0]));
      }
      if (filters.amountRange?.[1] !== undefined && !Number.isNaN(filters.amountRange[1])) {
        params.set('amount[lte]', String(filters.amountRange[1]));
      }

      const response = await api.get(`/api/v2/transactions/export.csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const filename = `transactions_${timeframe.after.format('YYYYMMDD')}_${timeframe.before.format('YYYYMMDD')}.csv`;
      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [ledger]);

  return { handleExport, isExporting };
};
