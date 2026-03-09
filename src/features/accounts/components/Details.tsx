import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, ChevronUp, FileText, Star, StarOff } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
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
import {
  DailyList,
  TableListing,
  TableListingSkeleton,
  useTransactionsAndTransfersList,
} from '@/features/daily-ledger';
import { useIsMobile } from '@/hooks/use-mobile';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

interface Props {
  account: Account;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => void;
}

const AccountDetail: React.FC<Props> = ({ account, onAccountUpdate }) => {
  const daysPerPage = 15;
  const isMobile = useIsMobile();

  const defaultRange = useMemo(
    () => {
      const today = moment().startOf('day');
      return {
        after: today.clone().subtract(daysPerPage - 1, 'days'),
        before: today.clone().endOf('day'),
      };
    },
    [],
  );

  const [heatmapRange, setHeatmapRange] = useState<{ after: moment.Moment; before: moment.Moment } | null>(null);
  const activeRange = heatmapRange ?? defaultRange;

  // Collapse heatmap by default on small screens
  const [heatmapExpanded, setHeatmapExpanded] = useState(() => window.innerHeight > 680);
  // Open a sheet on mobile when a heatmap range is selected
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { groupedItems, isLoading, isError, error, setFilter } = useTransactionsAndTransfersList({
    updateUrl: true,
    omitTransferTransactions: true,
  });

  // Draft count for bank accounts
  const draftCountQuery = useQuery({
    queryKey: ['details-drafts', account.id],
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

  useEffect(() => {
    setFilter('after', activeRange.after);
    setFilter('before', activeRange.before);
  }, [activeRange, setFilter]);

  useEffect(() => {
    setFilter('accounts', [account.id]);
  }, [account, setFilter]);

  const handleHeatmapRangeSelect = useCallback(
    (after: moment.Moment, before: moment.Moment) => {
      setHeatmapRange({ after, before });
      if (isMobile) setMobileDrawerOpen(true);
    },
    [isMobile],
  );

  const handleHeatmapRangeClear = useCallback(() => {
    setHeatmapRange(null);
    setMobileDrawerOpen(false);
  }, []);

  const highlightDates = useMemo(() => {
    const dates: string[] = [];
    const cursor = activeRange.after.clone().startOf('day');
    const end = activeRange.before.clone().startOf('day');
    while (cursor.isSameOrBefore(end, 'day')) {
      dates.push(cursor.format('YYYY-MM-DD'));
      cursor.add(1, 'day');
    }
    return dates;
  }, [activeRange.after, activeRange.before]);

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

  const renderActivityContent = () => {
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-lg font-semibold text-destructive">Error loading transactions</p>
          <p className="text-sm text-muted-foreground">{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }

    if (!isLoading && groupedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <p className="text-lg font-semibold">No activity found</p>
          <p className="text-sm text-muted-foreground">No transactions or transfers for the selected period.</p>
        </div>
      );
    }

    return (
      <>
        <div className={cn('md:hidden')}>
          <DailyList
            after={activeRange.after}
            before={activeRange.before}
            groupedItems={groupedItems}
            isLoading={isLoading}
          />
        </div>
        <div className="hidden md:block">
          {isLoading && <TableListingSkeleton after={activeRange.after} before={activeRange.before} />}
          {!isLoading && (
            <TableListing
              after={activeRange.after}
              before={activeRange.before}
              groupedItems={groupedItems}
              isLoading={isLoading}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Hero card: account info + embedded balance history chart */}
      <Card className="mb-4 overflow-hidden shrink-0">
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
          <CardDescription>
            Created: <RelativeDatetimeDisplay date={account.createdAt} />
          </CardDescription>
        </CardHeader>

        {/* Chart flush to card edges — no horizontal padding */}
        <CardContent className="p-0">
          <BalanceHistoryChart account={account} />
        </CardContent>
      </Card>

      {/* Pending draft transactions notice — only for active bank accounts */}
      {account.type === AccountType.Bank && draftCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm shrink-0">
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 shrink-0 text-warning" />
            <span>
              <span className="font-medium">{draftCount}</span> pending transaction{draftCount !== 1 ? 's' : ''} to review
            </span>
          </div>
          <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => setFilter('isDraft', true)}>
            Review drafts →
          </Button>
        </div>
      )}

      {/* Activity card: heatmap + ledger merged, fills remaining height */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="flex-row items-start justify-between gap-2 pb-0 shrink-0">
          <div className="min-w-0">
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>
              {heatmapRange
                ? `${heatmapRange.after.format('D MMM')} – ${heatmapRange.before.format('D MMM YYYY')}`
                : `Transactions for the past ${daysPerPage} days — drag to filter`}
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 mt-0.5"
                onClick={() => setHeatmapExpanded((prev) => !prev)}
              >
                {heatmapExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">{heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{heatmapExpanded ? 'Collapse heatmap' : 'Expand heatmap'}</TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {heatmapExpanded && (
            <HeatmapPanel
              currency={account.currency}
              filters={{ accounts: [account.id] }}
              highlightDates={highlightDates}
              onRangeClear={handleHeatmapRangeClear}
              onRangeSelect={handleHeatmapRangeSelect}
            />
          )}
          {/* On desktop: show transactions inline */}
          {!isMobile && (
            <div className={cn('border-t flex-1 min-h-0 overflow-y-auto', !heatmapExpanded && 'border-0')}>
              {renderActivityContent()}
            </div>
          )}
          {/* On mobile: show transactions inline when no range selected; otherwise open drawer */}
          {isMobile && !heatmapRange && (
            <div className={cn('border-t flex-1 min-h-0 overflow-y-auto', !heatmapExpanded && 'border-0')}>
              {renderActivityContent()}
            </div>
          )}
        </CardContent>
      </Card>

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
              {heatmapRange
                ? `${heatmapRange.after.format('D MMM')} – ${heatmapRange.before.format('D MMM YYYY')}`
                : 'Transactions'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderActivityContent()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AccountDetail;
