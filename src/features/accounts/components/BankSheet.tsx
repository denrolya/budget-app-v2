import { format } from 'date-fns';
import { AlertTriangle, Building2, CalendarIcon, CreditCard, Loader2, RefreshCw, Unplug, Webhook } from 'lucide-react';
import moment from 'moment';
import React, { useState } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BankProvider,
  SyncMethod,
  useBankAccounts,
  useBankIntegrationList,
  useRegisterWebhook,
  useSyncBankIntegration,
} from '@/features/bank-integrations';
import { cn } from '@/lib/utils';
import { confirm } from '@/lib/confirmation';

import Account from '../models/Account';
import { UpdateAccountDTO } from '../types';

import ConnectBankDialog from './ConnectBankDialog';

const PROVIDER_LABELS: Record<BankProvider, string> = {
  [BankProvider.Monobank]: 'Monobank',
  [BankProvider.Wise]: 'Wise',
};

interface Props {
  account: Account;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => void;
}

const BankSheet: React.FC<Props> = ({ account, onAccountUpdate }) => {
  const integration = account.bankIntegration;
  const [open, setOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [syncFrom, setSyncFrom] = useState<Date | undefined>(undefined);
  const [syncTo, setSyncTo] = useState<Date | undefined>(undefined);

  const integrationId = integration?.id ?? 0;
  const sync = useSyncBankIntegration(integrationId);
  const registerWebhook = useRegisterWebhook(integrationId);
  // Fetch live bank accounts only when the sheet is open and there is an integration
  const bankAccounts = useBankAccounts(integrationId, !!integration && open);

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
    setOpen(false);
  };

  const integrationsList = useBankIntegrationList();
  const hasAnyIntegration = (integrationsList.data?.length ?? 0) > 0;

  const isConnected = !!integration;
  const isActive = isConnected && integration.isActive;
  const isWebhookOnly = integration?.syncMethod === SyncMethod.Webhook;

  let statusColor = 'bg-muted-foreground/40';
  if (isConnected) statusColor = 'bg-yellow-500';
  if (isActive) statusColor = 'bg-green-500';

  const providerRaw = integration
    ? typeof integration.provider === 'string'
      ? integration.provider
      : ((integration.provider as any)?.value ?? '')
    : '';
  const providerLabel = (PROVIDER_LABELS[providerRaw as BankProvider] ?? providerRaw) || 'Unknown';

  let tooltipText = 'Bank integration not configured';
  if (isActive) tooltipText = `Connected: ${providerLabel}`;
  else if (isConnected) tooltipText = 'Bank connected (inactive)';
  else if (hasAnyIntegration) tooltipText = 'No bank connected';

  const syncFromLabel = syncFrom ? format(syncFrom, 'dd MMM yyyy') : 'All time';
  const syncToLabel = syncTo ? format(syncTo, 'dd MMM yyyy') : 'Today';
  const syncButtonIcon = sync.isPending ? (
    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
  ) : (
    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
  );
  const syncButtonText = sync.isPending ? 'Syncing…' : 'Sync now';
  const statusBadgeVariant = isActive ? BadgeVariant.Success : BadgeVariant.Warning;
  const statusBadgeText = isActive ? 'Active' : 'Inactive';
  const lastSyncedText = integration?.lastSyncedAt ? (
    <>
      Synced <RelativeDatetimeDisplay date={moment(integration.lastSyncedAt)} />
    </>
  ) : (
    <span>Never synced</span>
  );

  // Accounts from the bank API, filtered to match this account's currency
  const filteredBankAccounts = (bankAccounts.data ?? []).filter((ba) => ba.currency === account.currency);

  const renderDisconnectedState = () => {
    if (hasAnyIntegration) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <Unplug className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No bank connected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Link this account to a bank integration to import transactions automatically.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setConnectDialogOpen(true);
            }}
          >
            <Building2 className="mr-1.5 h-4 w-4" />
            Connect bank
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <Unplug className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">No bank integration set up</p>
          <p className="mt-1 text-sm text-muted-foreground">
            First configure a bank integration (Monobank or Wise), then link it to this account.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setOpen(false);
            setConnectDialogOpen(true);
          }}
        >
          <Building2 className="mr-1.5 h-4 w-4" />
          Set up integration
        </Button>
      </div>
    );
  };

  const renderBankAccountsSection = () => {
    if (!integration || bankAccounts.isError) return null;

    return (
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live accounts ({account.currency})</p>
        {bankAccounts.isLoading ? (
          <div className="flex items-center gap-1.5 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        ) : filteredBankAccounts.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">No {account.currency} accounts found at this bank.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredBankAccounts.map((ba) => (
              <div
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                key={ba.externalId}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{ba.name}</span>
                </div>
                <span className="ml-2 shrink-0 font-medium tabular-nums">
                  {ba.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  {ba.currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConnectedState = () => {
    if (!integration) return null;
    return (
      <div className="flex flex-col gap-4">
        {/* Status row */}
        <div className="rounded-md border px-3 py-2.5 flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium">{providerLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={statusBadgeVariant}>{statusBadgeText}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last synced</span>
            <span>{lastSyncedText}</span>
          </div>
        </div>

        {/* Inactive webhook warning */}
        {isWebhookOnly && !isActive && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Webhook is not active — incoming transactions will not be imported. Click{' '}
              <strong>Re-register webhook</strong> to restore the connection.
            </span>
          </div>
        )}

        {/* Live bank accounts */}
        {renderBankAccountsSection()}

        {/* Webhook info OR polling sync range */}
        {isWebhookOnly ? (
          <p className="text-xs text-muted-foreground">
            This integration uses webhook-based sync — transactions arrive automatically. If they stop, re-register the
            webhook below.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Sync range (optional)</p>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-1">
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
                      {syncFromLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar initialFocus mode="single" selected={syncFrom} onSelect={setSyncFrom} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-1 flex-col gap-1">
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
                      {syncToLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-0">
                    <Calendar initialFocus mode="single" selected={syncTo} onSelect={setSyncTo} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t">
          {isWebhookOnly ? (
            <Button
              disabled={registerWebhook.isPending}
              size="sm"
              variant="outline"
              onClick={() => registerWebhook.mutate()}
            >
              {registerWebhook.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Webhook className="h-3.5 w-3.5 mr-1.5" />
              )}
              {registerWebhook.isPending ? 'Registering…' : 'Re-register webhook'}
            </Button>
          ) : (
            <Button disabled={sync.isPending} size="sm" variant="outline" onClick={handleSync}>
              {syncButtonIcon}
              {syncButtonText}
            </Button>
          )}
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
      </div>
    );
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Bank connection"
            size="icon"
            variant="outline"
            className="relative"
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Manage bank connection</span>
            <Building2 aria-hidden="true" className="h-4 w-4" />
            <span
              className={cn('absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-background', statusColor)}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-sm">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank connection
            </SheetTitle>
          </SheetHeader>
          {isConnected ? renderConnectedState() : renderDisconnectedState()}
        </SheetContent>
      </Sheet>

      <ConnectBankDialog account={account} open={connectDialogOpen} onOpenChange={setConnectDialogOpen} />
    </>
  );
};

export default BankSheet;
