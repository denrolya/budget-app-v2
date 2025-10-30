import React, { useCallback, useMemo, useState } from 'react';

import PieChart from '@/components/features/statistics/AccountsDoughnut/Chart';

const CurrenciesDoughnutChart: React.FC<{
  currencies: { code: string; display: string; value: number }[];
  accountsByCurrency: Record<string, { id: string | number; name: string; value: number }[]>;
  isExpense: boolean;
  onBreadcrumbChange?: (currency: string | null) => void;
}> = ({ currencies, accountsByCurrency, isExpense, onBreadcrumbChange }) => {
  const [currency, setCurrency] = useState<string | null>(null);

  const { data, total } = useMemo(() => {
    if (!currency) {
      const d = currencies.map(c => ({ id: c.code, label: c.display, value: c.value }));
      const t = currencies.reduce((a, c) => a + c.value, 0);
      return { data: d, total: t };
    }
    const items = accountsByCurrency[currency] ?? [];
    return {
      data: items.map(i => ({ id: i.id, label: i.name, value: i.value })),
      total: items.reduce((a, i) => a + i.value, 0),
    };
  }, [currency, currencies, accountsByCurrency]);

  const scheme = useMemo(
    () => ({ scheme: isExpense ? 'reds' : 'greens' } as const),
    [isExpense],
  );

  const onSliceClick = useCallback(
    (id: string | number) => {
      if (!currency) {
        setCurrency(String(id));
        onBreadcrumbChange?.(String(id));
      }
    },
    [currency, onBreadcrumbChange],
  );

  // render your breadcrumbs externally using `currency` state if you like.
  return <PieChart data={data} total={total} colorScheme={scheme} onSliceClick={onSliceClick} />;
};

export default CurrenciesDoughnutChart;
