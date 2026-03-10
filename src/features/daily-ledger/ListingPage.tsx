import { PanelTopClose, PanelTopOpen, RotateCcw, SquarePlus } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useRef, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { HeatmapPanel } from '@/features/transactions';

import LedgerView from './components/LedgerView';
import { useLedger } from './hooks/useLedger';

export const DailyLedgerPage: React.FC = () => {
  const { openForm } = useFormContext();

  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
  const [displayMenuTarget, setDisplayMenuTarget] = useState<HTMLDivElement | null>(null);

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
    [ledger.setTimeframe],
  );

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
                      <PanelTopClose aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <PanelTopOpen aria-hidden="true" className="h-4 w-4" />
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
        </CardHeader>

        <CardContent className="w-full min-w-0 p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {isHeatmapVisible && (
            <div className="shrink-0 border-b">
              <HeatmapPanel
                highlightDates={ledger.visibleDates}
                resetTrigger={heatmapResetTrigger}
                showViewMode={false}
                year={ledger.timeframe.after.year()}
                onRangeClear={ledger.resetAll}
                onRangeSelect={handleHeatmapRangeSelect}
              />
            </div>
          )}

          <LedgerView enableHotkeys showControls displayMenuPortalTarget={displayMenuTarget} ledger={ledger} />
        </CardContent>
      </Card>
    </FullHeightPageContent>
  );
};

DailyLedgerPage.displayName = 'DailyLedgerPage';
export default DailyLedgerPage;
