import { AlertCircle, Star, StarOff } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import BalanceHistoryChart from '@/features/accounts/components/BalanceHistoryChart';
import AccountPill from '@/features/accounts/components/Pill';
import { TransactionHeatmapChart } from '@/features/transactions';
import Account from '@/features/accounts/models/Account';
import { UpdateAccountDTO } from '@/features/accounts/types';
import {
  DailyList,
  TableListing,
  TableListingSkeleton,
  useTransactionsAndTransfersList,
} from '@/features/daily-ledger';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

interface Props {
  account: Account;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => void;
}

const AccountDetail: React.FC<Props> = ({ account, onAccountUpdate }) => {
  const currentDate = moment().startOf('day');
  const daysPerPage = 15;

  const defaultRange = useMemo(
    () => ({
      after: currentDate.clone().subtract(daysPerPage - 1, 'days'),
      before: currentDate.clone().endOf('day'),
    }),
    [],
  );

  const [heatmapRange, setHeatmapRange] = useState<{ after: moment.Moment; before: moment.Moment } | null>(null);
  const activeRange = heatmapRange ?? defaultRange;

  const { groupedItems, isLoading, isError, error, setFilter } = useTransactionsAndTransfersList({
    updateUrl: true,
    omitTransferTransactions: true,
  });

  useEffect(() => {
    setFilter('after', activeRange.after);
    setFilter('before', activeRange.before);
  }, [activeRange, setFilter]);

  useEffect(() => {
    setFilter('accounts', [account.id]);
  }, [account, setFilter]);

  const handleHeatmapRangeSelect = useCallback((after: moment.Moment, before: moment.Moment) => {
    setHeatmapRange({ after, before });
  }, []);

  const handleHeatmapRangeClear = useCallback(() => {
    setHeatmapRange(null);
  }, []);

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
    <>
      {/* Hero card: account info + embedded balance history chart */}
      <Card className="mb-4 overflow-hidden">
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

      {/* Transaction heatmap */}
      <Card className="mb-4 overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Activity</CardTitle>
          <CardDescription>Transaction activity by day — drag to filter the list below</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionHeatmapChart
            accountIds={[account.id]}
            currency={account.currency}
            onRangeClear={handleHeatmapRangeClear}
            onRangeSelect={handleHeatmapRangeSelect}
          />
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            {heatmapRange
              ? `${heatmapRange.after.format('D MMM')} – ${heatmapRange.before.format('D MMM YYYY')}`
              : `Transactions for the past ${daysPerPage} days`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">{renderActivityContent()}</ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};

export default AccountDetail;
