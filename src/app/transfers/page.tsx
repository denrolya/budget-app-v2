import { useQuery, useQueryClient } from '@tanstack/react-query';
import cn from 'classnames';
import { CalendarIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton.tsx';
import { TransactionFactory } from '@/models/Transaction';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { TransferFilters } from '@/models/TransferFilters';
import { Pagination } from '@/components/common/Pagination';
import EmptyTransferState from '@/components/features/transfers/EmptyTransferState';
import TransferListItem, { ListItemSkeleton as TransferListItemSkeleton } from '@/components/features/transfers/ListItem';
import { BACKEND_DATE_FORMAT, MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import { axiosFetcher } from '@/services/api';
import Transfer from '@/models/Transfer';

const defaultFilters = new TransferFilters();

interface TransformedResponse {
  list: Transfer[];
}

const datePresets = [
  { label: 'This Month', range: { from: moment().startOf('month'), to: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { from: moment().subtract(30, 'days'), to: moment() } },
  { label: 'This Year', range: { from: moment().startOf('year'), to: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { from: moment().subtract(1, 'year').startOf('year'), to: moment().subtract(1, 'year').endOf('year') },
  },
];

export const TransferList: React.FC = () => {
  const { createTransaction } = TransactionFactory();
  const { openForm } = useFormContext();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const {
    pagination: { currentPage, pageSize, totalPages },
    filters,
    sort,
    setCurrentPage,
    setFilter,
    setSort,
    setTotalPages,
  } = useListState<any, Transfer>({
    initialPageSize: 10,
    initialFilters: defaultFilters,
    initialSort: { field: 'executedAt', direction: 'desc' },
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      amountRange: 'amount',
      accounts: 'accounts',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    updateUrl: true,
  });

  const url = useMemo(() => {
    const query = new URLSearchParams();

    const addParam = (key: string, value: unknown) => {
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isEmptyValue = value === undefined || value === null || value === '';

      if (!isEmptyValue && !isEmptyArray) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(`${key}[]`, item.toString());
          });
        } else if (typeof value === 'boolean') {
          query.set(key, value ? '1' : '0');
        } else if (moment.isMoment(value)) {
          query.set(`executedAt[${key}]`, value.format(BACKEND_DATE_FORMAT));
        } else {
          query.set(key, value.toString());
        }
      }
    };

    query.set('perPage', pageSize.toString());
    query.set('page', currentPage.toString());

    Object.entries(filters).forEach(([key, value]) => {
      addParam(key, value);
    });

    if (sort.field) query.set('sortField', sort.field as string);
    if (sort.direction) query.set('sortDirection', sort.direction);

    return `/api/transfers?${query.toString()}`;
  }, [filters, currentPage, pageSize, sort]);

  const { data, error, isPending, isError, isFetching, refetch } = useQuery<TransformedResponse, Error>({
    queryKey: ['transfers', url],
    queryFn: async (): Promise<TransformedResponse> => {
      const result = await axiosFetcher(url);
      return {
        list: result['hydra:member'].map(t => new Transfer({
          ...t,
            transactions: t.transactions.map(createTransaction),
        })),
        count: result['hydra:totalItems'],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (isError) {
      setTotalPages(0);
      toast.error('Failed to fetch transfers', {
        description: error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => refetch(),
        },
      });
    } else if (data) {
      setTotalPages(Math.ceil(data.count / pageSize) || 0);
    }
  }, [isError, data, pageSize, setTotalPages]);

  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
  }, [queryClient]);

  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);

  const groupedAndSortedTransfers = useMemo(() => {
    const transfers = data?.list;

    if (!transfers) return [];

    const grouped = transfers.reduce((groups, transfer) => {
      const date = moment(transfer.executedAt).format('YYYY-MM-DD');
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
        transfers: transfers.sort((a, b) =>
          moment(b.executedAt).diff(moment(a.executedAt)),
        ),
      }));
  }, [data?.list]);

  const RECENT_THRESHOLD_DAYS = 7;

  const formatTransferDate = (dateString: string): string => {
    const transferDate = moment(dateString);
    const now = moment();

    const diffInDays = now.diff(transferDate, 'day');

    const formattedDate = transferDate.format('MMM D, YYYY'); // e.g., "Sep 16, 2024"

    if (diffInDays < RECENT_THRESHOLD_DAYS) {
      const relativeTime = transferDate.fromNow(); // e.g., "3 days ago"
      return `${relativeTime} (${formattedDate})`; // e.g., "3 days ago (Sep 20, 2024)"
    } else {
      return formattedDate;
    }
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setFilter('after', range.from ? moment(range.from) : undefined);
    setFilter('before', range.to ? moment(range.to) : undefined);
  };

  return (
    <section className="container p-4 mx-auto pb-20 md:pb-4">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Transfer List</h1>

        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('h-9 text-sm')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
              {filters.after && filters.before
                ? `${filters.after.format(MOMENT_DATEPICKER_FORMAT)} - ${filters.before.format(MOMENT_DATEPICKER_FORMAT)}`
                : filters.after
                  ? `After ${filters.after.format(MOMENT_DATEPICKER_FORMAT)}`
                  : filters.before
                    ? `Before ${filters.before.format(MOMENT_DATEPICKER_FORMAT)}`
                    : 'Date'}
            </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.after?.toDate() || moment().toDate()}
                selected={{
                  from: filters.after?.toDate(),
                  to: filters.before?.toDate(),
                }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                className="border-b"
              />
              <div className="p-3 space-y-3">
                <h4 className="font-medium text-sm text-primary">Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      size="sm"
                      variant="secondary"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => {
                        handleDateRangeChange(preset.range);
                        setIsDatePopoverOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        {isPending && (
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

        {(!isPending && !isError && data) && (
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

        {(isFetching && !isPending) && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
            Updating...
          </div>
        )}
      </div>
    </section>
  );
};

export default TransferList;
