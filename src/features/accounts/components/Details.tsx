import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, FileText, Filter, Maximize2, Minimize2, Star, StarOff } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AccountDraftBadge from '@/features/accounts/components/AccountDraftBadge';
import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import BalanceHistoryChart from '@/features/accounts/components/BalanceHistoryChart';
import AccountPill from '@/features/accounts/components/Pill';
import { HeatmapPanel } from '@/features/transactions';
import { transactionService } from '@/features/transactions/api/service';
import Account from '@/features/accounts/models/Account';
import { Type as AccountType, UpdateAccountDTO } from '@/features/accounts/types';
import InlineFilters from '@/features/transactions/components/InlineFilters';
import { LedgerView, useLedger } from '@/features/daily-ledger';
import { useIsMobile } from '@/hooks/use-mobile';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

interface Props {
  account: Account;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => void;
}

const AccountDetail: React.FC<Props> = ({ account, onAccountUpdate }) => {
  const isMobile = useIsMobile();

  // Keep initial range bounded to avoid very large first-load payloads.
  const defaultRange = useMemo(
    () => ({
      after: moment().subtract(90, 'days').startOf('day'),
      before: moment().endOf('day'),
    }),
    [],
  );

  const [isHeatmapRangeActive, setIsHeatmapRangeActive] = useState(false);

  // Defer heavy heatmap query and rendering until user expands it.
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);
  const [heatmapMounted, setHeatmapMounted] = useState(false);
  useEffect(() => {
    if (heatmapExpanded && !heatmapMounted) setHeatmapMounted(true);
  }, [heatmapExpanded, heatmapMounted]);
  // Open a sheet on mobile when a heatmap range is selected
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  // Activity card fullscreen overlay
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Bank integration details collapsed by default
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);

  const ledger = useLedger({
    updateUrl: false,
    omitTransfers: true,
    initialShowEmptyDays: false,
    initialFilters: { accounts: [account.id] },
    initialTimeframe: defaultRange,
  });

  // Draft count for bank accounts
  const draftCountQuery = useQuery({
    queryKey: ['account-drafts', account.id],
    queryFn: () =>
      transactionService.fetchList({
        page: 1,
        perPage: 1,
        filters: { accounts: [account.id], isDraft: true } as any,
        sort: {} as any,
        omitTransferTransactions: false,
      }),
    enabled: account.type === AccountType.Bank && !!account.bankIntegration?.isActive,
    staleTime: 1000 * 30,
  });
  const draftCount = draftCountQuery.data?.totalItems ?? 0;

  const handleHeatmapRangeSelect = useCallback(
    (after: moment.Moment, before: moment.Moment) => {
      setIsHeatmapRangeActive(true);
      ledger.setTimeframe({ after, before });
      if (isMobile) setMobileDrawerOpen(true);
    },
    [isMobile, ledger],
  );

  const handleHeatmapRangeClear = useCallback(() => {
    setIsHeatmapRangeActive(false);
    setMobileDrawerOpen(false);
    ledger.setTimeframe(defaultRange);
  }, [ledger, defaultRange]);

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

  const handleSortToggle = useCallback(() => ledger.setIsReversedOrder(!ledger.isReversedOrder), [ledger]);

  const handleLedgerReset = useCallback(() => {
    ledger.resetAll();
    ledger.setFilter('accounts', [account.id]);
  }, [ledger, account.id]);

  const toggleSidebarVisibility = async () => {
    const confirmed = await confirm({
      title: account.isDisplayedOnSidebar ? 'Hide from sidebar?' : 'Show in sidebar?',
      description: account.isDisplayedOnSidebar
        ? `${account.name} will no longer be shown in the sidebar.`
        : `${account.name} will be added to your sidebar.`,
      confirmText: account.isDisplayedOnSidebar ? 'Hide' : 'Show',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    account.isDisplayedOnSidebar = !account.isDisplayedOnSidebar;
    onAccountUpdate(account, { isDisplayedOnSidebar: account.isDisplayedOnSidebar });
  };

  const renderActivityContent = () => (
    <LedgerView
      enableHotkeys={false}
      ledger={ledger}
      showControls={false}
      onReset={handleLedgerReset}
    />
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Hero card: account info + embedded balance history chart */}
      <Card className="mb-4 overflow-hidden shrink-0 animate-in fade-in-0 slide-in-from-top-3 duration-500 ease-out">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <AccountPill showName account={account} tooltip={false} variant="inline" />
            <MoneyValue
              badge
              showSign
              amount={account.balance}
              currency={account.currency}
              values={account.convertedValues}
            />
            <AccountDraftBadge account={account} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={account.isDisplayedOnSidebar ? 'Hide from sidebar' : 'Show in sidebar'}
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={toggleSidebarVisibility}
                >
                  {account.isDisplayedOnSidebar ? (
                    <Star className="h-3.5 w-3.5" />
                  ) : (
                    <StarOff className="h-3.5 w-3.5" />
                  )}
                  <span className="sr-only">
                    {account.isDisplayedOnSidebar ? 'Hide from sidebar' : 'Show in sidebar'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{account.isDisplayedOnSidebar ? 'Pinned to sidebar' : 'Pin to sidebar'}</TooltipContent>
            </Tooltip>
          </CardTitle>

          {/* Account property grid */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              Created: <RelativeDatetimeDisplay date={account.createdAt} />
            </span>
            {account.externalAccountId && (
              <>
                <span className="text-border select-none">·</span>
                <span className="font-mono text-[10px]">ID: {account.externalAccountId}</span>
              </>
            )}
            {account.isArchived() && (
              <>
                <span className="text-border select-none">·</span>
                <span className="text-orange-500">Archived {account.archivedAt?.format('D MMM YYYY')}</span>
              </>
            )}
          </div>

          {/* Bank integration details — compact toggle */}
          {account.bankIntegration && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <button
                type="button"
                className="flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setBankDetailsOpen((v) => !v)}
              >
                <span className="capitalize">
                  {account.bankIntegration.provider.charAt(0).toUpperCase() + account.bankIntegration.provider.slice(1)}
                </span>
                <Badge
                  variant={account.bankIntegration.isActive ? 'default' : 'destructive'}
                  className="text-[10px] px-1.5 py-0 pointer-events-none"
                >
                  {account.bankIntegration.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {bankDetailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {bankDetailsOpen && (
                <>
                  {account.bankIntegration.syncMethod && (
                    <>
                      <span className="text-border select-none">·</span>
                      <span className="capitalize">{account.bankIntegration.syncMethod}</span>
                    </>
                  )}
                  {account.bankIntegration.lastSyncedAt && (
                    <>
                      <span className="text-border select-none">·</span>
                      <span>
                        Last sync: <RelativeDatetimeDisplay date={moment(account.bankIntegration.lastSyncedAt)} />
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </CardHeader>

        {/* Chart flush to card edges — no horizontal padding */}
        <CardContent className="p-0">
          <BalanceHistoryChart account={account} />
        </CardContent>
      </Card>

      {/* Pending draft transactions notice — only for active bank accounts */}
      {account.type === AccountType.Bank && draftCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm shrink-0 animate-in fade-in-0 slide-in-from-top-2 duration-300 ease-out">
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 shrink-0 text-warning" />
            <span>
              <span className="font-medium">{draftCount}</span> pending transaction{draftCount !== 1 ? 's' : ''} to
              review
            </span>
          </div>
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => ledger.setFilter('isDraft', true)}
          >
            Review drafts →
          </Button>
        </div>
      )}

      {/* Activity card: heatmap + ledger merged, fills remaining height */}
      <div
        className={cn(
          'flex-1 min-h-0',
          isFullscreen &&
            'fixed inset-0 z-50 bg-background p-3 animate-in fade-in-0 zoom-in-[0.98] duration-200 ease-out',
        )}
      >
        <Card className="h-full flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out">
          <CardHeader className="pb-1 shrink-0 relative pr-[5.5rem]">
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>
              {isHeatmapRangeActive
                ? `${ledger.timeframe.after.format('D MMM')} – ${ledger.timeframe.before.format('D MMM YYYY')}`
                : 'Latest activity — drag on heatmap to filter'}
            </CardDescription>
            {/* Action buttons pinned to top-right corner of the card */}
            <div className="absolute top-2 right-2 flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Open filters"
                    size="icon"
                    variant="ghost"
                    className="relative h-7 w-7"
                    onClick={ledger.toggleFilters}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {ledger.activeFilterCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {ledger.activeFilterCount > 0 ? `Filters (${ledger.activeFilterCount})` : 'Filters'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setIsFullscreen((prev) => !prev)}
                  >
                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    <span className="sr-only">{isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setHeatmapExpanded((prev) => !prev)}
                  >
                    {heatmapExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    <span className="sr-only">{heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}</TooltipContent>
              </Tooltip>
            </div>

            {!isMobile && (
              <div className="pt-2 min-w-0">
                <InlineFilters
                  inHeader
                  hideAccountFilter
                  data={ledger.transactionFilters}
                  sortDirection={ledger.isReversedOrder ? 'desc' : 'asc'}
                  onChange={handleFilterChange as any}
                  onSortToggle={handleSortToggle}
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* CSS grid-rows accordion animation for heatmap */}
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-in-out shrink-0',
                heatmapExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                {heatmapMounted && (
                  <HeatmapPanel
                    currency={account.currency}
                    filters={{ accounts: [account.id] }}
                    highlightDates={ledger.visibleDates}
                    year={ledger.timeframe.after.year()}
                    onRangeClear={handleHeatmapRangeClear}
                    onRangeSelect={handleHeatmapRangeSelect}
                  />
                )}
              </div>
            </div>
            {/* On desktop: show transactions inline */}
            {!isMobile && <div className="border-t flex-1 min-h-0 overflow-y-auto">{renderActivityContent()}</div>}
            {/* On mobile: show transactions inline when no range selected; otherwise open drawer */}
            {isMobile && !isHeatmapRangeActive && (
              <div className={cn('border-t flex-1 min-h-0 overflow-y-auto', !heatmapExpanded && 'border-0')}>
                {renderActivityContent()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile drawer: transactions for selected heatmap range */}
      <Sheet
        open={isMobile && mobileDrawerOpen}
        onOpenChange={(v) => {
          if (!v) handleHeatmapRangeClear();
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
          <div className="flex-1 min-h-0 overflow-y-auto">{renderActivityContent()}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AccountDetail;
