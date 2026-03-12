import { AlertCircle, Building2, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BankProvider,
  SyncMethod,
  useBankAccounts,
  useBankIntegrationList,
  useCreateBankIntegration,
  useRegisterWebhook,
} from '@/features/bank-integrations';

import { useMutations } from '../api/mutations';
import type Account from '../models/Account';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
}

const PROVIDER_LABELS: Record<BankProvider, string> = {
  [BankProvider.Monobank]: 'Monobank',
  [BankProvider.Wise]: 'Wise',
};

const PROVIDER_DESCRIPTIONS: Record<BankProvider, string> = {
  [BankProvider.Monobank]: 'Import transactions via webhook (real-time)',
  [BankProvider.Wise]: 'Import transactions via webhook or scheduled polling',
};

const SYNC_METHOD_LABELS: Record<SyncMethod, string> = {
  [SyncMethod.Webhook]: 'Webhook (real-time)',
  [SyncMethod.Polling]: 'Polling (scheduled)',
};

type Step = 'setup' | 'connect';

const ConnectBankDialog: React.FC<Props> = ({ open, onOpenChange, account }) => {
  const [step, setStep] = useState<Step>('connect');
  const [selectedProvider, setSelectedProvider] = useState<BankProvider | null>(null);
  const [selectedSyncMethod, setSelectedSyncMethod] = useState<SyncMethod | null>(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number | null>(null);
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);

  const integrations = useBankIntegrationList();
  const bankAccounts = useBankAccounts(selectedIntegrationId ?? 0, !!selectedIntegrationId);
  const { update, isUpdating } = useMutations();
  const createIntegration = useCreateBankIntegration();
  const registerWebhook = useRegisterWebhook(selectedIntegrationId ?? 0);

  const activeIntegrations = integrations.data?.filter((i) => i.isActive) ?? [];

  // Determine starting step when dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedProvider(null);
    setSelectedSyncMethod(null);
    setSelectedExternalId(null);

    if (integrations.isSuccess) {
      if (activeIntegrations.length === 0) {
        setStep('setup');
        setSelectedIntegrationId(null);
      } else {
        setStep('connect');
        // Auto-select if only one integration
        setSelectedIntegrationId(activeIntegrations.length === 1 ? activeIntegrations[0].id : null);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once integrations load, set the correct step
  useEffect(() => {
    if (!open || !integrations.isSuccess) return;
    if (activeIntegrations.length === 0 && step !== 'setup') {
      setStep('setup');
      setSelectedIntegrationId(null);
    }
  }, [integrations.isSuccess, activeIntegrations.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset external account when integration changes
  useEffect(() => {
    setSelectedExternalId(null);
  }, [selectedIntegrationId]);

  const selectedIntegration = integrations.data?.find((i) => i.id === selectedIntegrationId) ?? null;
  const shouldRegisterWebhook = selectedIntegration?.syncMethod === SyncMethod.Webhook;
  const canConnect = !!selectedIntegrationId && !!selectedExternalId;
  const isConnecting = isUpdating || registerWebhook.isPending;

  const handleSetup = async () => {
    if (!selectedProvider) return;

    const syncMethod =
      selectedProvider === BankProvider.Wise ? (selectedSyncMethod ?? SyncMethod.Polling) : SyncMethod.Webhook;

    const created = await createIntegration.mutateAsync({ provider: selectedProvider, syncMethod });
    setSelectedIntegrationId(created.id);
    setStep('connect');
  };

  const handleConnect = async () => {
    if (!selectedIntegrationId || !selectedExternalId) return;
    await update({
      id: account.id,
      diff: {
        bankIntegration: `/api/bank-integrations/${selectedIntegrationId}`,
        externalAccountId: selectedExternalId,
      },
    });
    if (shouldRegisterWebhook) {
      await registerWebhook.mutateAsync();
    }
    onOpenChange(false);
  };

  const renderSetupStep = () => (
    <>
      <DialogDescription>
        No bank integrations are configured yet. Choose a provider to set one up — the connection will use
        server-configured credentials.
      </DialogDescription>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label>Provider</Label>
          <div className="flex flex-col gap-2">
            {Object.values(BankProvider).map((provider) => (
              <button
                type="button"
                className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-muted/50 ${
                  selectedProvider === provider ? 'border-primary bg-primary/5' : 'border-border bg-transparent'
                }`}
                key={provider}
                onClick={() => {
                  setSelectedProvider(provider);
                  if (provider !== BankProvider.Wise) {
                    setSelectedSyncMethod(SyncMethod.Webhook);
                  }
                }}
              >
                <span className="font-medium text-sm">{PROVIDER_LABELS[provider]}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{PROVIDER_DESCRIPTIONS[provider]}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedProvider === BankProvider.Wise && (
          <div className="flex flex-col gap-1.5">
            <Label>Sync method</Label>
            <div className="flex flex-col gap-2">
              {Object.values(SyncMethod).map((method) => (
                <button
                  type="button"
                  className={`flex items-center rounded-lg border px-4 py-2 text-left transition-colors hover:border-primary/60 hover:bg-muted/50 ${
                    selectedSyncMethod === method ? 'border-primary bg-primary/5' : 'border-border bg-transparent'
                  }`}
                  key={method}
                  onClick={() => setSelectedSyncMethod(method)}
                >
                  <span className="font-medium text-sm">{SYNC_METHOD_LABELS[method]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          disabled={
            !selectedProvider ||
            (selectedProvider === BankProvider.Wise && !selectedSyncMethod) ||
            createIntegration.isPending
          }
          onClick={handleSetup}
        >
          {createIntegration.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Set up integration
        </Button>
      </DialogFooter>
    </>
  );

  const renderConnectStep = () => (
    <>
      <DialogDescription>
        Link <strong>{account.name}</strong> to a bank integration to import transactions automatically.
      </DialogDescription>
      <div className="flex flex-col gap-4 py-2">
        {/* Integration picker — only shown when >1 integration exists */}
        {activeIntegrations.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="integration-select">Bank integration</Label>

            {integrations.isLoading && <Skeleton className="h-9 w-full" />}
            {integrations.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Failed to load integrations
              </div>
            )}
            {integrations.isSuccess && (
              <Select
                value={selectedIntegrationId?.toString() ?? ''}
                onValueChange={(v) => setSelectedIntegrationId(Number(v))}
              >
                <SelectTrigger id="integration-select">
                  <SelectValue placeholder="Select integration…" />
                </SelectTrigger>
                <SelectContent>
                  {activeIntegrations.map((integration) => (
                    <SelectItem value={integration.id.toString()} key={integration.id}>
                      {PROVIDER_LABELS[integration.provider] ?? integration.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Single integration — show provider name as context */}
        {activeIntegrations.length === 1 && selectedIntegration && (
          <p className="text-sm text-muted-foreground">
            Using <strong>{PROVIDER_LABELS[selectedIntegration.provider]}</strong> integration.
          </p>
        )}

        {/* Bank account picker */}
        {selectedIntegrationId && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-select">Bank account</Label>

            {bankAccounts.isLoading && <Skeleton className="h-9 w-full" />}
            {bankAccounts.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Failed to fetch accounts from the bank
              </div>
            )}
            {bankAccounts.isSuccess && bankAccounts.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No accounts found for this integration.</p>
            )}
            {bankAccounts.isSuccess && bankAccounts.data.length > 0 && (
              <Select value={selectedExternalId ?? ''} onValueChange={(v) => setSelectedExternalId(v)}>
                <SelectTrigger id="account-select">
                  <SelectValue placeholder="Select account…" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.data.map((ba) => (
                    <SelectItem value={ba.externalId} key={ba.externalId}>
                      {ba.name} — {ba.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {shouldRegisterWebhook && selectedIntegrationId && (
          <p className="text-xs text-muted-foreground">
            Webhook mode is enabled. The webhook URL will be registered automatically on connect.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button disabled={!canConnect || isConnecting} onClick={handleConnect}>
          {isConnecting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Connect
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {step === 'setup' ? 'Set up bank integration' : 'Connect a bank'}
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' ? renderSetupStep() : renderConnectStep()}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectBankDialog;
