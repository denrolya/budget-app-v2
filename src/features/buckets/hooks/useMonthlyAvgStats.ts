import moment from 'moment';
import { useMemo } from 'react';

import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';

/**
 * Fetches last 6 months of expense/income data and returns averages
 * (non-zero months only). Used to pre-fill health rule inputs.
 */
export const useMonthlyAvgStats = () => {
  const after = useMemo(() => moment().subtract(5, 'months').startOf('month'), []);
  const before = useMemo(() => moment().endOf('month'), []);

  const { data, isLoading } = useValueByPeriodStatisticsRequest({
    after,
    before,
    period: 'P1M',
    queryKey: 'buckets-monthly-avg',
  });

  const avgExpense = useMemo(() => {
    if (!data || data.length === 0) return null;
    const nonZero = data.filter((d) => d.expense > 0);
    return nonZero.length > 0 ? Math.round(nonZero.reduce((s, d) => s + d.expense, 0) / nonZero.length) : null;
  }, [data]);

  const avgIncome = useMemo(() => {
    if (!data || data.length === 0) return null;
    const nonZero = data.filter((d) => d.income > 0);
    return nonZero.length > 0 ? Math.round(nonZero.reduce((s, d) => s + d.income, 0) / nonZero.length) : null;
  }, [data]);

  return { avgExpense, avgIncome, isLoading };
};
