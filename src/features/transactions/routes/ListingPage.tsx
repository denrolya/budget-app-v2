import { Download, PanelTopClose, PanelTopOpen, RefreshCw, RotateCcw, SquarePlus } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useState } from 'react';

import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import SummaryBadge from '@/components/common/SummaryBadge';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { LedgerView, useLedger } from '@/features/daily-ledger';
import { useIsMobile } from '@/hooks/use-mobile';

import { useMutations } from '../api/mutations';
import HeatmapPanel from '../components/HeatmapPanel';
import InlineFilters from '../components/InlineFilters';
import ListFiltersSheet from '../components/ListFiltersSheet';

const DEFAULT_HEATMAP_RANGE = {
  after: moment().subtract(30, 'days').startOf('day'),
  before: moment().endOf('day'),
};

export const TransactionsListPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);

  const ledger = useLedger({ updateUrl: true, omitTransfers: true });
  const { exportTransactionsCsv, isExportingCsv } = useMutations({ invalidateKey: 'transactions' });

  const totalItems = ledger.transactionsState.pagination.totalItems;
  const totalValue = ledger.transactionsState.totalValue;
  const isUpdatingBannerVisible = ledger.isFetching && !ledger.isLoading;

  const openNewTransactionForm = useCallback(() => openForm(FormType.Transaction), [openForm]);

  const exportCsv = useCallback(
    () => void exportTransactionsCsv(ledger.transactionFilters),
    [exportTransactionsCsv, ledger],
  );

  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      if (key === 'after' && value) {
        ledger.setTimeframe({ after: value as Moment, before: ledger.timeframe.before });
        return;
      }
      if (key === 'before' && value) {
        ledger.setTimeframe({ after: ledger.timeframe.after, before: value as Moment });
        return;
      }
      ledger.setFilter(key, value);
    },
    [ledger],
  );

  const handleHeatmapRangeSelect = useCallback(
    (after: Moment, before: Moment) => ledger.setTimeframe({ after, before }),
    [ledger],
  );

  const handleHeatmapRangeClear = useCallback(() => ledger.setTimeframe(DEFAULT_HEATMAP_RANGE), [ledger]);

  const handleSortToggle = useCallback(() => ledger.setIsReversedOrder(!ledger.isReversedOrder), [ledger]);

  const toggleHeatmap = useCallback(() => setIsHeatmapVisible((v) => !v), []);

  const heatmapFilters = {
    accounts: ((ledger.transactionFilters.accounts as string[]) ?? []).map(Number),
    categories: ledger.transactionFilters.categories,
    excludedCategories: ledger.transactionFilters.excludedCategories,
    type: ledger.transactionFilters.type,
    currencies: ledger.transactionFilters.currencies,
    isDraft: ledger.transactionFilters.isDraft,
    note: ledger.transactionFilters.searchTerm || undefined,
    amountGte: Number.isFinite(ledger.transactionFilters.amountRange?.[0])
      ? ledger.transactionFilters.amountRange![0]
      : undefined,
    amountLte: Number.isFinite(ledger.transactionFilters.amountRange?.[1])
      ? ledger.transactionFilters.amountRange![1]
      : undefined,
  };

  const heatmapIcon = isHeatmapVisible ? (
    <PanelTopClose aria-hidden="true" className="h-4 w-4" />
  ) : (
    <PanelTopOpen aria-hidden="true" className="h-4 w-4" />
  );

  return (
    <FullHeightPageContent>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Transactions</CardTitle>

            <div aria-label="Transactions actions" role="toolbar" className="flex flex-wrap items-center gap-2">
              <SummaryBadge count={totalItems} icon={ROUTES.TRANSACTION_LIST.icon} value={totalValue} />

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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Export current transactions to CSV"
                    disabled={isExportingCsv}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={exportCsv}
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Refresh transactions list"
                    disabled={ledger.isLoading}
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={ledger.refetch}
                  >
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

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
                    onClick={toggleHeatmap}
                  >
                    {heatmapIcon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isHeatmapVisible ? 'Hide heatmap' : 'Show heatmap'}</TooltipContent>
              </Tooltip>

              <FiltersToggleButton
                activeCount={ledger.activeFilterCount}
                aria-label={ledger.isFiltersOpen ? 'Close filters' : 'Open filters'}
                onClick={ledger.toggleFilters}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {isHeatmapVisible && (
            <div className="shrink-0 border-b">
              <HeatmapPanel
                filters={heatmapFilters}
                highlightDates={ledger.visibleDates}
                showViewMode={false}
                year={ledger.timeframe.after.year()}
                onRangeClear={handleHeatmapRangeClear}
                onRangeSelect={handleHeatmapRangeSelect}
              />
            </div>
          )}

          {!isMobile && (
            <div className="shrink-0">
              <InlineFilters
                data={ledger.transactionFilters}
                sortDirection={ledger.isReversedOrder ? 'desc' : 'asc'}
                onChange={handleFilterChange as any}
                onSortToggle={handleSortToggle}
              />
            </div>
          )}

          <LedgerView ledger={ledger} showControls={false} showFiltersSheet={false} />
        </CardContent>
      </Card>

      {isUpdatingBannerVisible && (
        <div
          aria-live="polite"
          role="status"
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded shadow"
        >
          Updating…
        </div>
      )}

      <ListFiltersSheet
        data={ledger.transactionFilters}
        isOpen={ledger.isFiltersOpen}
        setIsOpen={ledger.setIsFiltersOpen}
        onChange={handleFilterChange as any}
        onReset={ledger.resetAll}
      />
    </FullHeightPageContent>
  );
};

TransactionsListPage.displayName = 'TransactionsListPage';

export default TransactionsListPage;
