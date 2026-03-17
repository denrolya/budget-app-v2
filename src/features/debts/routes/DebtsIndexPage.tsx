import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import type { CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';

import { useList as useDebtsQuery } from '../api';
import DebtsSunburstChart, { type HoveredSunburstNode } from '../components/DebtsSunburstChart';

const DebtsIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const baseCurrency = useBaseCurrency();
  const [hovered, setHovered] = useState<HoveredSunburstNode | null>(null);

  const { data: debts = [] } = useDebtsQuery({ withClosed: true });

  const handleHoverChange = useCallback((node: HoveredSunburstNode | null) => {
    setHovered(node);
  }, []);

  const { open, closed, total } = useMemo(() => {
    const openList = debts.filter((d) => !d.isClosed());
    const closedList = debts.filter((d) => d.isClosed());
    const openTotal = openList.reduce((s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? 0), 0);
    const closedTotal = closedList.reduce((s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? 0), 0);
    return { open: openList, closed: closedList, total: openTotal + closedTotal };
  }, [debts, baseCurrency]);

  const centerInfo = useMemo(() => {
    if (!hovered) {
      return {
        label: 'Total exposure',
        amount: total,
        currency: undefined as string | undefined,
        sub: `${open.length} open · ${closed.length} closed`,
        color: null as string | null,
      };
    }
    const node = hovered.data;
    const isDebt = node.debtId !== undefined;
    if (isDebt) {
      const debt = debts.find((d) => d.id === node.debtId);
      return {
        label: node.name,
        amount: Math.abs(node.rawBalance ?? 0),
        currency: node.currency,
        sub: `${hovered.percentage.toFixed(1)}% of total${debt?.isClosed() ? ' · Closed' : ''}`,
        color: hovered.color,
      };
    }
    return {
      label: node.name,
      amount: hovered.value,
      currency: undefined as string | undefined,
      sub: `${hovered.percentage.toFixed(1)}% of total`,
      color: hovered.color,
    };
  }, [hovered, total, open.length, closed.length, debts]);

  if (debts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No debts recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0">
      <DebtsSunburstChart
        debts={debts}
        onHoverChange={handleHoverChange}
        onNavigate={(id) => navigate(`/debts/${id}`)}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-8 py-5 rounded-full bg-background/80 backdrop-blur-sm max-w-[240px] transition-all duration-100">
          {centerInfo.color && (
            <span
              aria-hidden
              style={{ backgroundColor: centerInfo.color }}
              className="inline-block h-2.5 w-2.5 rounded-full mb-2 flex-none"
            />
          )}
          <p className="text-xs text-muted-foreground leading-tight mb-1.5 truncate w-full">{centerInfo.label}</p>
          <p className="text-3xl font-bold text-foreground leading-tight">
            <MoneyValue
              amount={centerInfo.amount}
              currency={centerInfo.currency as CURRENCY_CODE | undefined}
              useColors={false}
              values={{}}
              className="text-3xl font-bold"
            />
          </p>
          {centerInfo.sub && <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{centerInfo.sub}</p>}
        </div>
      </div>
    </div>
  );
};

export default DebtsIndexPage;
