import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import type { Moment } from 'moment';
import React, { useCallback, useEffect, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import { type UseLedgerReturn } from '../hooks/useLedger';

import LedgerView from './LedgerView';
import ListingControls from './ListingControls';

export interface HeatmapArgs {
  onRangeSelect: (after: Moment, before: Moment) => void;
  /** Resets ledger timeframe to default + closes mobile sheet. */
  onRangeClear: () => void;
  /**
   * Only resets internal state (mobile sheet, active flag) — does NOT call onHeatmapRangeClear.
   * Use for year-change events where the parent already updated the timeframe.
   */
  onRangeReset: () => void;
  year: number;
}

interface Props {
  ledger: UseLedgerReturn;
  disabledFilters?: string[];
  onReset: () => void;
  /** Called when a heatmap range is selected — update ledger timeframe here. */
  onHeatmapRangeSelect?: (after: Moment, before: Moment) => void;
  /** Called when the heatmap range is cleared — reset ledger timeframe to default here. */
  onHeatmapRangeClear?: () => void;
  /** Render prop: called lazily when heatmap is first expanded. */
  heatmap?: (args: HeatmapArgs) => React.ReactNode;
  className?: string;
}

const LedgerActivityCard: React.FC<Props> = ({
  ledger,
  disabledFilters,
  onReset,
  onHeatmapRangeSelect,
  onHeatmapRangeClear,
  heatmap,
  className,
}) => {
  const isMobile = useIsMobile();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);
  const [heatmapMounted, setHeatmapMounted] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isHeatmapRangeActive, setIsHeatmapRangeActive] = useState(false);

  useEffect(() => {
    if (heatmapExpanded && !heatmapMounted) setHeatmapMounted(true);
  }, [heatmapExpanded, heatmapMounted]);

  const handleRangeSelect = useCallback(
    (after: Moment, before: Moment) => {
      onHeatmapRangeSelect?.(after, before);
      setIsHeatmapRangeActive(true);
      if (isMobile) setMobileDrawerOpen(true);
    },
    [onHeatmapRangeSelect, isMobile],
  );

  const handleRangeClear = useCallback(() => {
    onHeatmapRangeClear?.();
    setIsHeatmapRangeActive(false);
    setMobileDrawerOpen(false);
  }, [onHeatmapRangeClear]);

  const handleRangeReset = useCallback(() => {
    setIsHeatmapRangeActive(false);
    setMobileDrawerOpen(false);
  }, []);

  const heatmapArgs: HeatmapArgs = {
    onRangeSelect: handleRangeSelect,
    onRangeClear: handleRangeClear,
    onRangeReset: handleRangeReset,
    year: ledger.timeframe.after.year(),
  };

  const activityContent = (
    <LedgerView
      disabledFilters={disabledFilters}
      enableHotkeys={false}
      ledger={ledger}
      showControls={false}
      onReset={onReset}
    />
  );

  return (
    <>
      <div
        className={cn(
          'flex-1 min-h-0',
          isFullscreen &&
            'fixed inset-0 z-50 bg-background p-3 animate-in fade-in-0 zoom-in-[0.98] duration-200 ease-out',
          className,
        )}
      >
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="p-2 md:p-2.5 shrink-0 border-b">
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-1 min-w-0 overflow-x-auto">
                <ListingControls
                  disabledFilters={disabledFilters}
                  isReversedOrder={ledger.isReversedOrder}
                  setFilter={ledger.setFilter}
                  setIsReversedOrder={ledger.setIsReversedOrder}
                  setShowTransactions={ledger.setShowTransactions}
                  setShowTransfers={ledger.setShowTransfers}
                  setTimeframe={ledger.setTimeframe}
                  showTransactions={ledger.showTransactions}
                  showTransfers={ledger.showTransfers}
                  timeframe={ledger.timeframe}
                  transactionFilters={ledger.transactionFilters}
                  transferFilters={ledger.transferFilters}
                />
              </div>

              <div aria-label="Activity actions" role="toolbar" className="flex items-center gap-1 shrink-0 ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
                      size="icon"
                      type="button"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setIsFullscreen((v) => !v)}
                    >
                      {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}</TooltipContent>
                </Tooltip>

                {heatmap && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label={heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}
                        size="icon"
                        type="button"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setHeatmapExpanded((v) => !v)}
                      >
                        {heatmapExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}</TooltipContent>
                  </Tooltip>
                )}

                <FiltersToggleButton activeCount={ledger.activeFilterCount} className="h-7 w-7" onClick={ledger.toggleFilters} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
            {heatmap && (
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out shrink-0',
                  heatmapExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  {heatmapMounted && heatmap(heatmapArgs)}
                </div>
              </div>
            )}

            {!isMobile && <div className="border-t flex-1 min-h-0 overflow-y-auto">{activityContent}</div>}
            {isMobile && !isHeatmapRangeActive && (
              <div className={cn('border-t flex-1 min-h-0 overflow-y-auto', !heatmapExpanded && 'border-0')}>
                {activityContent}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet
        open={isMobile && mobileDrawerOpen}
        onOpenChange={(v) => {
          if (!v) handleRangeClear();
          setMobileDrawerOpen(v);
        }}
      >
        <SheetContent side="bottom" className="h-[80dvh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <SheetTitle className="text-sm font-medium">
              {isHeatmapRangeActive
                ? `${ledger.timeframe.after.format('D MMM')} – ${ledger.timeframe.before.format('D MMM YYYY')}`
                : 'Transactions'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">{activityContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
};

LedgerActivityCard.displayName = 'LedgerActivityCard';
export default LedgerActivityCard;
