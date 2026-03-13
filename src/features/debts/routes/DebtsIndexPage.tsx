import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import type { CURRENCY_CODE } from '@/constants/currency';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  const { open, closed, openTotal, closedTotal, total } = useMemo(() => {
    const open = debts.filter((d) => !d.isClosed());
    const closed = debts.filter((d) => d.isClosed());
    const openTotal = open.reduce((s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? 0), 0);
    const closedTotal = closed.reduce((s, d) => s + Math.abs(d.convertedValues?.[baseCurrency] ?? 0), 0);
    return { open, closed, openTotal, closedTotal, total: openTotal + closedTotal };
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

  return (
    <div className="flex h-full flex-col bg-muted overflow-hidden">
      <div className="flex-1 min-h-0 p-4 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
        <Card className="h-full overflow-hidden flex flex-col">
          {/* Stats strip — mirrors AccountsIndexPage */}
          <div className="flex-none border-b px-5 py-2.5 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{debts.length}</span> debt
              {debts.length !== 1 ? 's' : ''}
            </span>
            <div aria-hidden className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{open.length}</span> open
            </span>
            <div aria-hidden className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{closed.length}</span> closed
            </span>
            {open.length > 0 && (
              <>
                <div aria-hidden className="h-3.5 w-px bg-border" />
                <span className="text-muted-foreground">
                  Open exposure:{' '}
                  <MoneyValue
                    amount={openTotal}
                    useColors={false}
                    values={{}}
                    className="font-semibold text-foreground text-xs"
                  />
                </span>
              </>
            )}
          </div>

          {/* Chart + left panel */}
          <CardContent className="flex flex-1 min-h-0 min-w-0 overflow-hidden p-0">
            {/* Left panel */}
            <div className="w-56 lg:w-64 shrink-0 flex flex-col min-h-0 min-w-0 overflow-hidden border-r">
              <ScrollArea className="flex-1">
                <div className="space-y-5 p-4 pb-3">
                  {/* Open debts */}
                  {open.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 ease-out [animation-fill-mode:both]">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span aria-hidden className="h-2.5 w-2.5 rounded-sm flex-none bg-[hsl(var(--chart-1))]" />
                          <span className="text-sm font-semibold text-foreground">Open</span>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <MoneyValue
                            amount={openTotal}
                            useColors={false}
                            values={{}}
                            className="font-semibold text-foreground text-xs"
                          />
                          {total > 0 && (
                            <span className="text-muted-foreground ml-1">
                              {((openTotal / total) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 pl-[18px]">
                        {open.map((debt) => (
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-xs text-muted-foreground gap-2 hover:text-foreground hover:bg-muted rounded px-1.5 py-1 transition-colors cursor-pointer text-left"
                            key={debt.id}
                            onClick={() => navigate(`/debts/${debt.id}`)}
                          >
                            <span className="truncate">{debt.debtor}</span>
                            <MoneyValue
                              amount={debt.balance}
                              currency={debt.currency}
                              useColors={false}
                              values={debt.convertedValues}
                              className="text-xs tabular-nums shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Closed debts */}
                  {closed.length > 0 && (
                    <div
                      style={{ animationDelay: `${open.length > 0 ? 120 : 0}ms` }}
                      className="animate-in fade-in slide-in-from-left-4 duration-300 ease-out [animation-fill-mode:both]"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span aria-hidden className="h-2.5 w-2.5 rounded-sm flex-none bg-muted-foreground/40" />
                          <span className="text-sm font-semibold text-foreground">Closed</span>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <MoneyValue
                            amount={closedTotal}
                            useColors={false}
                            values={{}}
                            className="font-semibold text-foreground text-xs"
                          />
                          {total > 0 && (
                            <span className="text-muted-foreground ml-1">
                              {((closedTotal / total) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 pl-[18px]">
                        {closed.map((debt) => (
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-xs text-muted-foreground gap-2 hover:text-foreground hover:bg-muted rounded px-1.5 py-1 transition-colors cursor-pointer text-left"
                            key={debt.id}
                            onClick={() => navigate(`/debts/${debt.id}`)}
                          >
                            <span className="truncate">{debt.debtor}</span>
                            <MoneyValue
                              amount={debt.balance}
                              currency={debt.currency}
                              useColors={false}
                              values={debt.convertedValues}
                              className="text-xs tabular-nums shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {debts.length === 0 && <p className="text-sm text-muted-foreground">No debts recorded yet.</p>}
                </div>
              </ScrollArea>

              {/* Summary footer */}
              <div
                style={{ animationDelay: '280ms' }}
                className="flex-none border-t p-4 space-y-2.5 animate-in fade-in duration-300 ease-out [animation-fill-mode:both]"
              >
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  By status
                </p>
                {[
                  { label: 'Open', value: openTotal, total },
                  { label: 'Closed', value: closedTotal, total },
                ].map(({ label, value, total: t }) => (
                  <div className="space-y-1" key={label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground tabular-nums">
                        {t > 0 ? ((value / t) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        style={{ width: `${t > 0 ? (value / t) * 100 : 0}%` }}
                        className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div aria-hidden className="flex-none w-px bg-border self-stretch my-3" />

            {/* Sunburst + center overlay */}
            <div className="relative min-h-0 min-w-0 flex-[1_1_0%] basis-0">
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
                  <p className="text-xs text-muted-foreground leading-tight mb-1.5 truncate w-full">
                    {centerInfo.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground leading-tight">
                    <MoneyValue
                      amount={centerInfo.amount}
                      currency={centerInfo.currency as CURRENCY_CODE | undefined}
                      useColors={false}
                      values={{}}
                      className="text-3xl font-bold"
                    />
                  </p>
                  {centerInfo.sub && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{centerInfo.sub}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebtsIndexPage;
