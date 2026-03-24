import { ChevronRight } from 'lucide-react';
import React from 'react';

import type { CURRENCY_CODE } from '@/constants/currency';
import MoneyValue from '@/components/common/MoneyValue';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Item } from './types';

type RenderLabelArgs = {
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
};

const DistributionList: React.FC<Props> = ({
  ariaLabel,
  items,
  total,
  getDotColor,
  onRowClick,
  onViewTransactions,
  renderLabel,
}) => (
  <ScrollArea aria-label={ariaLabel} className="h-full min-h-0">
    <div className="py-1">
      {items.map((item) => {
        const rowKey = String(item.id);
        const dotColor = getDotColor?.(item) ?? item.color ?? null;
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const canDrill = item.hasChildren && !!onRowClick;

        const handleClick = () => {
          if (onRowClick) {
            onRowClick(rowKey);
          } else {
            onViewTransactions(rowKey);
          }
        };

        return (
          <button
            type="button"
            aria-label={
              canDrill ? `Drill into ${item.name}` : `View ${item.name} transactions (${percentage.toFixed(0)}%)`
            }
            className="group w-full flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
            key={rowKey}
            onClick={handleClick}
          >
            {/* Color dot */}
            {dotColor && (
              <span
                aria-hidden="true"
                style={{ backgroundColor: dotColor }}
                className="h-2 w-2 rounded-full shrink-0"
              />
            )}

            {/* Name */}
            <span className="min-w-0 flex-[2] truncate text-2xs text-foreground">
              {renderLabel ? renderLabel({ item, percentage }) : item.name}
            </span>

            {/* Progress bar */}
            <div aria-hidden="true" className="flex-[3] h-1 bg-muted rounded-full overflow-hidden shrink-0">
              <div
                style={{
                  transform: `scaleX(${Math.max(percentage, item.value > 0 ? 2 : 0) / 100})`,
                  backgroundColor: dotColor ?? 'hsl(var(--primary))',
                  opacity: 0.7,
                }}
                className="h-full w-full rounded-full origin-left transition-transform duration-300 will-change-[transform]"
              />
            </div>

            {/* Value */}
            <div className="shrink-0 flex flex-col items-end gap-0 min-w-[60px]">
              <MoneyValue
                amount={item.value}
                useColors={false}
                className="text-2xs font-mono tabular-nums leading-none text-foreground"
              />
              {item.amount != null && item.amount !== item.value && (
                <MoneyValue
                  amount={item.amount}
                  currency={item.currency != null ? (item.currency as CURRENCY_CODE) : undefined}
                  useColors={false}
                  className="text-2xs font-mono tabular-nums leading-none text-muted-foreground mt-0.5"
                />
              )}
            </div>

            {/* Percentage */}
            <span className="shrink-0 text-2xs font-mono tabular-nums text-muted-foreground w-7 text-right leading-none">
              {percentage.toFixed(0)}%
            </span>

            {/* Drill indicator */}
            {canDrill && (
              <ChevronRight
                aria-hidden="true"
                className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
              />
            )}
          </button>
        );
      })}
    </div>
  </ScrollArea>
);

export default React.memo(DistributionList);
