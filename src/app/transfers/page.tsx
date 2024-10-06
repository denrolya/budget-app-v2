import moment from 'moment';
import React, { useMemo } from 'react';

import { Pagination } from '@/components/common/Pagination';
import EmptyTransferState from '@/components/features/transfers/EmptyTransferState';
import ListFilters from '@/components/features/transfers/ListFilters';
import TransferListItem, {
  ListItemSkeleton as TransferListItemSkeleton,
} from '@/components/features/transfers/ListItem';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransfers } from '@/hooks/useTransfers.tsx';
import Transfer from '@/models/Transfer';

export const TransferList: React.FC = () => {
  const {
    transfers,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, perPage, setCurrentPage },
    filters,
    setFilter,
    resetFilters,
    isFetching,
  } = useTransfers();
  const { openForm } = useFormContext();

  const groupedAndSortedTransfers = useMemo(() => {
    if (!transfers) return [];

    const grouped = transfers.reduce((groups, transfer) => {
      const date = transfer.executedAt.format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transfer);
      return groups;
    }, {} as Record<string, Transfer[]>);

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => moment(dateB).diff(moment(dateA)))
      .map(([date, transfers]) => ({
        date,
        transfers: transfers.sort((a, b) => b.executedAt.diff(a.executedAt)),
      }));
  }, [transfers]);


  const formatTransferDate = (dateString: string): string => {
    const RECENT_THRESHOLD_DAYS = 7;
    const transferDate = moment(dateString);
    const now = moment();

    const diffInDays = now.diff(transferDate, 'day');

    const formattedDate = transferDate.format('MMM D, YYYY');

    if (diffInDays < RECENT_THRESHOLD_DAYS) {
      const relativeTime = transferDate.fromNow();
      return `${relativeTime} (${formattedDate})`;
    } else {
      return formattedDate;
    }
  };

  return (
    <section className="container p-4 mx-auto pb-20 md:pb-4">
      <div className="flex-grow overflow-hidden flex flex-col">
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((group) => (
              <div key={group} className="mb-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <ul className="space-y-2">
                  {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, index) => (
                    <li key={index}>
                      <TransferListItemSkeleton />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive">
            <p className="font-medium">Error:</p>
            <p>{error?.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {(!isLoading && !isError && transfers) && (
          <>
            {groupedAndSortedTransfers.length > 0 && (
              <>
                {groupedAndSortedTransfers.map(({ date, transfers }) => (
                  <div key={date} className="mb-6">
                    <h5 className="text-lg font-semibold mb-2">{formatTransferDate(date)}</h5>
                    <ul className="space-y-2">
                      {transfers.map((transfer: Transfer) => (
                        <li key={transfer.id}>
                          <TransferListItem transfer={transfer} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mt-4">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </>
            )}
            {groupedAndSortedTransfers.length === 0 && (
              <EmptyTransferState onRefresh={refetch} onAddTransfer={() => openForm(FormType.Transfer)} />
            )}
          </>
        )}

        <ListFilters data={filters} onChange={setFilter} onReset={resetFilters} />

        {(isFetching && !isLoading) && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
            Updating...
          </div>
        )}
      </div>
    </section>
  );
};

export default TransferList;
