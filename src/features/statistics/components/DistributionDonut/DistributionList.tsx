import React, { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import DistributionListRowMenu from './DistributionListRowMenu';
import type { Item } from './types';

type RenderLabelArgs = {
  item: Item;
  percentage: number;
};

type RenderTooltipArgs = {
  item: Item;
  percentage: number;
};

type Props = {
  ariaLabel: string;
  items: Item[];
  total: number;
  getDotColor?: (item: Item) => string | null;
  onRowClick?: (id: string) => void;
  onViewTransactions: (id: string) => void;
  renderLabel?: (args: RenderLabelArgs) => React.ReactNode;
  renderTooltip?: (args: RenderTooltipArgs) => React.ReactNode;
};

const ROW_BASE = 'w-full flex items-center justify-between gap-3 rounded px-2 py-1 text-left transition-colors';
const ROW_INTERACTIVE =
  'hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const DistributionTable: React.FC<Props> = ({
                                              ariaLabel,
                                              items,
                                              total,
                                              getDotColor,
                                              onRowClick,
                                              onViewTransactions,
                                              renderLabel,
                                              renderTooltip,
                                            }) => {
  const rows = useMemo(() => [...items].reverse(), [items]);

  const DefaultLabel = useMemo(
    () =>
      ({ item, percentage }: RenderLabelArgs) => (
        <span className="truncate text-sm leading-5">
          {item.name}
          {item.value > 0 ? (
            <small className="ml-1 text-xs text-muted-foreground">({percentage.toFixed(0)}%)</small>
          ) : null}
        </span>
      ),
    [],
  );

  const DefaultTooltip = useMemo(
    () =>
      ({ item }: RenderTooltipArgs) => <span className="truncate">{item.name}</span>,
    [],
  );

  const LabelRenderer = renderLabel ?? DefaultLabel;
  const TooltipRenderer = renderTooltip ?? DefaultTooltip;

  const isClickable = Boolean(onRowClick);

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea aria-label={ariaLabel} className="h-full min-h-0">
        <div className="space-y-0.5 min-w-0">
          {rows.map((item) => {
            const dotColor = getDotColor?.(item) ?? null;
            const percentage = total > 0 ? (item.value / total) * 100 : 0;

            const left = (
              <div className="min-w-0 flex items-center gap-2">
                {dotColor && (
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: dotColor }}
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                  />
                )}

                <ResponsiveTooltip
                  openDelay={120}
                  content={TooltipRenderer({ item, percentage })}
                  triggerClassName="min-w-0 flex-1"
                >
                  <div className="min-w-0 flex-1">{LabelRenderer({ item, percentage })}</div>
                </ResponsiveTooltip>
              </div>
            );

            const right = (
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end gap-0.5 text-sm leading-5">
                  <MoneyValue amount={item.value} useColors={false} className="text-sm leading-5" />
                  {item.amount && (
                    <MoneyValue
                      amount={item.amount}
                      currency={item.currency}
                      useColors={false}
                      className="text-2xs leading-4 text-muted-foreground"
                    />
                  )}
                </div>
              </div>
            );

            const rowKey = String(item.id);

            if (isClickable) {
              return (
                <DistributionListRowMenu
                  item={item}
                  key={rowKey}
                  onSelect={() => onRowClick?.(rowKey)}
                  onViewTransactions={() => onViewTransactions(rowKey)}
                >
                  <Button
                    aria-label={`Select ${item.name}`}
                    type="button"
                    variant="ghost"
                    className={`${ROW_BASE} ${ROW_INTERACTIVE} h-auto justify-between font-normal bg-transparent`}
                    onClick={() => onRowClick?.(rowKey)}
                    onContextMenu={(e) => e.stopPropagation()}
                  >
                    <div className="min-w-0 flex-1">{left}</div>
                    {right}
                  </Button>
                </DistributionListRowMenu>
              );
            }

            return (
              <DistributionListRowMenu
                item={item}
                key={rowKey}
                onViewTransactions={() => onViewTransactions(rowKey)}
              >
                <div className={`${ROW_BASE} ${ROW_INTERACTIVE}`} onContextMenu={(e) => e.stopPropagation()}>
                  <div className="min-w-0 flex-1">{left}</div>
                  {right}
                </div>
              </DistributionListRowMenu>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DistributionTable;
