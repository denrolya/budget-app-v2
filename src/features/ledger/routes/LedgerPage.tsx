import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type moment from 'moment';
import React, { useCallback, useRef, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { usePageHeaderTitle } from '@/components/layout/header/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HeatmapPanel } from '@/features/transactions';
import { cn } from '@/lib/utils';

import ListingControls from '../components/ListingControls';
import LedgerView from '../components/LedgerView';
import { useLedger } from '../hooks/useLedger';

export const LedgerPage: React.FC = () => {
  usePageHeaderTitle('Ledger');

  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  // Heatmap ↔ listing sync: track when the heatmap is driving a range select so we
  // don't clear its selection in response to the resulting timeframe change.
  const isHeatmapDrivingRef = useRef(false);
  const [heatmapResetTrigger, setHeatmapResetTrigger] = useState(0);

  const handleListingTimeframeChange = useCallback(() => {
    if (isHeatmapDrivingRef.current) {
      isHeatmapDrivingRef.current = false;
      return;
    }
    setHeatmapResetTrigger((n) => n + 1);
  }, []);

  const ledger = useLedger({ updateUrl: true, onTimeframeChange: handleListingTimeframeChange });

  const handleHeatmapRangeSelect = useCallback(
    (after: moment.Moment, before: moment.Moment) => {
      isHeatmapDrivingRef.current = true;
      ledger.setTimeframe({ after, before });
    },
    [ledger],
  );

  return (
    <FullHeightPageContent>
      <Card className="w-full min-w-0 shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardContent className="w-full min-w-0 p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Sticky filters bar — always visible, never scrolls with the listing */}
          <div className="shrink-0 hidden md:flex items-center gap-2 border-b bg-card px-3 py-2 flex-wrap">
            <div className="flex-1 min-w-0 overflow-x-auto">
              <ListingControls
                disabledFilters={[]}
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

            <div className="flex items-center gap-1.5 shrink-0">
              {ledger.activeFilterCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Reset filters"
                      size="icon"
                      type="button"
                      variant="outline"
                      onClick={ledger.resetAll}
                    >
                      <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset filters</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={() => setIsHeatmapVisible((v) => !v)}
                  >
                    {isHeatmapVisible ? (
                      <ChevronUp aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <ChevronDown aria-hidden="true" className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}</TooltipContent>
              </Tooltip>

              <FiltersToggleButton
                activeCount={ledger.activeFilterCount}
                aria-label="Toggle filters"
                onClick={ledger.toggleFilters}
              />
            </div>
          </div>

          {/* Heatmap (collapsible) — below the filters bar */}
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-in-out shrink-0',
              isHeatmapVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              <div className="border-b">
                <HeatmapPanel
                  highlightDates={ledger.visibleDates}
                  resetTrigger={heatmapResetTrigger}
                  year={ledger.timeframe.after.year()}
                  onRangeClear={ledger.resetAll}
                  onRangeSelect={handleHeatmapRangeSelect}
                />
              </div>
            </div>
          </div>

          <LedgerView enableHotkeys ledger={ledger} showControls={false} />
        </CardContent>
      </Card>
    </FullHeightPageContent>
  );
};

LedgerPage.displayName = 'LedgerPage';
export default LedgerPage;
