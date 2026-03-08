import { PanelTopClose, PanelTopOpen, RotateCcw, SquarePlus } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useRef, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { TransactionHeatmapChart } from '@/features/transactions';

import ListingContainer, { type ListingHandle } from './components/ListingContainer';

export const DailyLedgerPage: React.FC = () => {
  const { openForm } = useFormContext();
  const listingRef = useRef<ListingHandle | null>(null);

  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [displayMenuTarget, setDisplayMenuTarget] = useState<HTMLDivElement | null>(null);

  // Heatmap ↔ listing sync: track when the heatmap is driving a range change so we
  // don't clear its selection in response to the resulting timeframe update.
  const isHeatmapDrivingRef = useRef(false);
  const [heatmapResetTrigger, setHeatmapResetTrigger] = useState(0);

  const handleHeatmapRangeSelect = useCallback((after: moment.Moment, before: moment.Moment) => {
    isHeatmapDrivingRef.current = true;
    listingRef.current?.setDateRange(after, before);
  }, []);

  const handleListingTimeframeChange = useCallback(() => {
    if (isHeatmapDrivingRef.current) {
      isHeatmapDrivingRef.current = false;
      return;
    }
    setHeatmapResetTrigger((n) => n + 1);
  }, []);

  const openNewTransactionForm = useCallback(() => {
    openForm(FormType.Transaction);
  }, [openForm]);


  return (
    <FullHeightPageContent>
      <Card className="w-full min-w-0 shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Ledger</CardTitle>

            <div aria-label="Ledger actions" role="toolbar" className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="New transaction"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={openNewTransactionForm}
                  >
                    <SquarePlus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>

              <div className="hidden md:contents" ref={setDisplayMenuTarget} />

              {activeFilterCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Reset filters"
                      size="icon"
                      type="button"
                      variant="outline"
                      onClick={() => listingRef.current?.resetFilters()}
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
                      <PanelTopClose aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <PanelTopOpen aria-hidden="true" className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}</TooltipContent>
              </Tooltip>

              <FiltersToggleButton
                activeCount={activeFilterCount}
                aria-label="Toggle filters"
                onClick={() => listingRef.current?.toggleFilters()}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="w-full min-w-0 p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {isHeatmapVisible && (
            <div className="shrink-0 border-b">
              <TransactionHeatmapChart
                accountIds={[]}
                resetTrigger={heatmapResetTrigger}
                onRangeClear={() => listingRef.current?.resetFilters()}
                onRangeSelect={handleHeatmapRangeSelect}
              />
            </div>
          )}

          <ListingContainer
            updateUrl
            displayMenuPortalTarget={displayMenuTarget}
            onActiveCountChange={setActiveFilterCount}
            onTimeframeChange={handleListingTimeframeChange}
            ref={listingRef}
          />
        </CardContent>
      </Card>
    </FullHeightPageContent>
  );
};

DailyLedgerPage.displayName = 'DailyLedgerPage';
export default DailyLedgerPage;
