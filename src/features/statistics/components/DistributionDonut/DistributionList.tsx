import React, { useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Item } from './types';
import { renderNativeLine } from './utils';

type RenderLabelArgs = {
  item: Item;
  pct: number;
};

type RenderTooltipArgs = {
  item: Item;
  pct: number;
};

type Props = {
  ariaLabel: string;
  items: Item[];
  total: number;

  getDotColor?: (item: Item) => string | null;

  onRowClick?: (id: string) => void;

  /**
   * Render left label block (account pill for accounts, plain text for others).
   * If not provided -> default label renderer.
   */
  renderLabel?: (args: RenderLabelArgs) => React.ReactNode;

  /**
   * Tooltip content for the left side. If not provided -> default tooltip.
   */
  renderTooltip?: (args: RenderTooltipArgs) => React.ReactNode;

  /**
   * Extra controls on the right (e.g. "view transactions" icon button for categories).
   */
  rightSlot?: (item: Item) => React.ReactNode;
};

const ROW_BASE =
  'w-full flex items-center justify-between gap-3 px-2 py-1 rounded hover:bg-muted/50 transition-colors';
const LEFT_WRAP = 'min-w-0 flex items-center gap-2';
const LABEL_TEXT = 'truncate text-sm leading-5';
const DOT_CLASS = 'h-2.5 w-2.5 rounded-full shrink-0';

const DistributionTable: React.FC<Props> = ({
                                              ariaLabel,
                                              items,
                                              total,
                                              getDotColor,
                                              onRowClick,
                                              renderLabel,
                                              renderTooltip,
                                              rightSlot,
                                            }) => {
  const rows = useMemo(() => [...items].reverse(), [items]);

  const DefaultLabel = useMemo(
    () =>
      ({ item, pct }: RenderLabelArgs) => (
        <span className={LABEL_TEXT}>
          {item.name}
          {item.value > 0 ? (
            <small className="ml-1 text-xs text-muted-foreground">({pct.toFixed(0)}%)</small>
          ) : null}
        </span>
      ),
    [],
  );

  const DefaultTooltip = useMemo(
    () =>
      ({ item }: RenderTooltipArgs) => (
        <>
          <span className="truncate">{item.name}</span>
          <span className="sr-only">.</span>
        </>
      ),
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
            const dot = getDotColor?.(item) ?? null;
            const pct = total > 0 ? (item.value / total) * 100 : 0;

            const left = (
              <div className={LEFT_WRAP}>
                {dot ? <span aria-hidden="true" style={{ backgroundColor: dot }} className={DOT_CLASS} /> : null}

                <ResponsiveTooltip
                  openDelay={120}
                  content={TooltipRenderer({ item, pct })}
                  triggerClassName="min-w-0 flex-1"
                >
                  <div className="min-w-0 flex-1">{LabelRenderer({ item, pct })}</div>
                </ResponsiveTooltip>
              </div>
            );

            const right = (
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end gap-0.5">
                  <MoneyValue amount={item.value} useColors={false} />
                  {renderNativeLine(item.amount, item.currency)}
                </div>
                {rightSlot ? rightSlot(item) : null}
              </div>
            );

            if (isClickable) {
              return (
                <Button
                  aria-label={`Select ${item.name}`}
                  type="button"
                  variant="ghost"
                  className={`${ROW_BASE} h-auto text-left font-normal focus-visible:ring-2 focus-visible:ring-ring`}
                  key={item.id}
                  onClick={() => onRowClick?.(String(item.id))}
                >
                  <div className="min-w-0 flex-1">{left}</div>
                  {right}
                </Button>
              );
            }

            return (
              <div className={ROW_BASE} key={item.id}>
                <div className="min-w-0 flex-1">{left}</div>
                {right}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DistributionTable;
