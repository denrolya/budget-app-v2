import { format } from 'date-fns';
import { Building2, CalendarIcon, Loader2, RefreshCw, Unplug } from 'lucide-react';
import moment from 'moment';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BankProvider, SyncMethod, useSyncBankIntegration } from '@/features/bank-integrations';
import { transactionService } from '@/features/transactions/api/service';
import { cn } from '@/lib/utils';
import { confirm } from '@/lib/confirmation';

import type Account from '../models/Account';
import { type UpdateAccountDTO } from '../types';

const PROVIDER_LABELS: Record<BankProvider, string> = {
  [BankProvider.Monobank]: 'Monobank',
  [BankProvider.Wise]: 'Wise',
};

const SYNC_METHOD_LABELS: Record<SyncMethod, string> = {
  [SyncMethod.Webhook]: 'Webhook',
  [SyncMethod.Polling]: 'Polling',
};

interface Props {
  account: Account;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => void;
  onConnectClick: () => void;
  onFilterDrafts: () => void;
}

const BankPanel: React.FC<Props> = ({ account, onAccountUpdate, onConnectClick, onFilterDrafts }) => {
  const integration = account.bankIntegration;
  const [syncFrom, setSyncFrom] = useState<Date | undefined>(undefined);
  const [syncTo, setSyncTo] = useState<Date | undefined>(undefined);

  const sync = useSyncBankIntegration(integration?.id ?? 0);

  // TODO: Move this query to transactions feature api/queries
  const draftCountQuery = useQuery({
    queryKey: ['bank-panel-drafts', account.id],
    queryFn: () =>
      transactionService.fetchList({
        page: 1,
        perPage: 1,
        filters: { accounts: [account.id], isDraft: true } as any,
        sort: {} as any,
        omitTransferTransactions: false,
      }),
    enabled: !!integration && integration.isActive,
    staleTime: 1000 * 30,
  });

  const draftCount = draftCountQuery.data?.totalItems ?? 0;

  // Todo: all date formats should be defined in datetime constants file
  const handleSync = () => {
    if (!integration) return;
    sync.mutate({
      from: syncFrom ? format(syncFrom, 'yyyy-MM-dd') : undefined,
      to: syncTo ? format(syncTo, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: 'Disconnect bank account?',
      description:
        'This will unlink the bank integration from this account. No transactions will be deleted. You can reconnect later.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    onAccountUpdate(account, { bankIntegration: null, externalAccountId: null });
  };

  if (!integration) {
    return (
      <Card className="mb-4 shrink-0">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Unplug className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No bank connected</p>
              <p className="text-xs">Link this account to a bank integration to import transactions automatically.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onConnectClick}>
            <Building2 className="h-4 w-4 mr-1.5" />
            Connect bank
          </Button>
        </CardContent>
      </Card>
    );
  }

  const providerLabel = PROVIDER_LABELS[integration.provider] ?? integration.provider;
  const syncMethodLabel = integration.syncMethod ? SYNC_METHOD_LABELS[integration.syncMethod] : 'Auto';

  return (
    <Card className="mb-4 shrink-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4" />
          Bank connection
        </CardTitle>
        <CardDescription>Connected via {providerLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={integration.isActive ? BadgeVariant.Success : BadgeVariant.Warning}>
            {integration.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={BadgeVariant.Secondary}>{providerLabel}</Badge>
          <Badge variant={BadgeVariant.Outline}>{syncMethodLabel}</Badge>

          <span className="ml-auto">
            {integration.lastSyncedAt ? (
              <>
                Synced <RelativeDatetimeDisplay date={moment(integration.lastSyncedAt)} />
              </>
            ) : (
              'Never synced'
            )}
          </span>
        </div>

        {/* Pending drafts notice */}
        {draftCount > 0 && (
          <div className="flex items-center justify-between rounded-md bg-warning/15 px-3 py-2 text-xs">
            <span className="font-medium">
              {draftCount} pending transaction{draftCount !== 1 ? 's' : ''} imported
            </span>
            <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={onFilterDrafts}>
              Review drafts →
            </Button>
          </div>
        )}

        {/* Sync date range */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal text-xs h-8',
                    !syncFrom && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {syncFrom ? format(syncFrom, 'dd MMM yyyy') : 'All time'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar initialFocus mode="single" selected={syncFrom} onSelect={setSyncFrom} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal text-xs h-8',
                    !syncTo && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {syncTo ? format(syncTo, 'dd MMM yyyy') : 'Today'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar initialFocus mode="single" selected={syncTo} onSelect={setSyncTo} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button disabled={sync.isPending} size="sm" variant="outline" onClick={handleSync}>
            {sync.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            {sync.isPending ? 'Syncing…' : 'Sync now'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDisconnect}
          >
            <Unplug className="h-3.5 w-3.5 mr-1.5" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankPanel;
