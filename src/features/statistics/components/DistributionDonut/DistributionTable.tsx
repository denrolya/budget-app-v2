import { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Item } from './types';
import { renderNativeLine } from './utils';

interface Props {
  items: Item[];
  total: number;
  getDotColor?: (item: Item) => string | null;
  onRowClick?: (id: string) => void;
  rightSlot?: (item: Item) => React.ReactNode;
  ariaLabel: string;
}

const DistributionTable: React.FC<Props> = ({
                                              items,
                                              total,
                                              getDotColor,
                                              onRowClick,
                                              rightSlot,
                                              ariaLabel,
                                            }) => {
  const reversed = useMemo(() => [...items].reverse(), [items]);

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea aria-label={ariaLabel} className="h-full min-h-0">
        <div className="space-y-0.5 min-w-0">
          {reversed.map((item) => {
            const dot = getDotColor?.(item) ?? null;
            const pct = total > 0 ? (item.value / total) * 100 : 0;

            const Left = (
              <div className="min-w-0 flex items-center gap-2">
                {dot && <span
                  aria-hidden="true"
                  style={{ backgroundColor: dot }}
                  className="h-2.5 w-2.5 rounded-full shrink-0" />}
                <span className="truncate text-sm leading-5">
                  {item.name}
                  {item.value > 0 && (
                    <small className="ml-1 text-xs text-muted-foreground">({pct.toFixed(0)}%)</small>
                  )}
                </span>
              </div>
            );

            const Right = (
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <MoneyValue amount={item.value} useColors={false} />
                {renderNativeLine(item.amount, item.currency)}
              </div>
            );

            const isClickable = Boolean(onRowClick);

            return isClickable ? (
              <Button
                aria-label={`Select ${item.name}`}
                type="button"
                variant="ghost"
                className="w-full justify-between px-2 py-1 h-auto text-left font-normal hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                key={item.id}
                onClick={() => onRowClick?.(String(item.id))}
              >
                <div className="min-w-0 flex-1">{Left}</div>
                <div className="flex items-center gap-2">{Right}{rightSlot?.(item)}</div>
              </Button>
            ) : (
              <div
                className="w-full flex items-center justify-between gap-3 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                key={item.id}>
                <div className="min-w-0 flex-1">{Left}</div>
                <div className="flex items-center gap-2">{Right}{rightSlot?.(item)}</div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DistributionTable;
