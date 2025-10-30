import React, { useMemo } from 'react';

import PieChart from '@/components/features/statistics/AccountsDoughnut/Chart';

const AccountsDoughnutChart: React.FC<{
  items: { id: string | number; name: string; value: number }[];
  total: number;
  isExpense: boolean;
}> = ({ items, total, isExpense }) => {
  const data = useMemo(
    () => items.map(i => ({ id: i.id, label: i.name, value: i.value })),
    [items],
  );
  const scheme = useMemo(
    () => ({ scheme: isExpense ? 'reds' : 'greens' } as const),
    [isExpense],
  );
  return <PieChart data={data} total={total} colorScheme={scheme} />;
};

export default AccountsDoughnutChart;
