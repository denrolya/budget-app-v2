import { Check, Edit, Star, StarOff, X } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AccountDraftBadge from '@/features/accounts/components/AccountDraftBadge';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import BalanceHistoryChart, { PRESETS, type PresetLabel } from '@/features/accounts/components/BalanceHistoryChart';
import type Account from '@/features/accounts/models/Account';
import { type UpdateAccountDTO } from '@/features/accounts/types';
import { useLedger } from '@/features/ledger';
import LedgerActivityCard from '@/features/ledger/components/LedgerActivityCard';
import { HeatmapPanel } from '@/features/transactions';
import { capitalize } from '@/lib/capitalize';
import { confirm } from '@/lib/confirmation';

// ─── Inline name editor ───────────────────────────────────────────────────────

interface InlineNameProps {
  account: Account;
  onSave: (name: string) => void;
}

const InlineName: React.FC<InlineNameProps> = ({ account, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(account.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setValue(account.name);
  }, [account.name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== account.name) onSave(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setValue(account.name);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <Input
          ref={inputRef}
          className="h-6 text-sm font-semibold px-1.5 py-0 flex-1 min-w-0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button aria-label="Save name" className="h-6 w-6" size="icon" variant="ghost" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
        <Button
          aria-label="Cancel edit"
          className="h-6 w-6"
          size="icon"
          variant="ghost"
          onClick={() => { setValue(account.name); setEditing(false); }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      className="group flex items-center gap-1 min-w-0 text-left"
      type="button"
      onClick={() => { setValue(account.name); setEditing(true); }}
    >
      <span className="truncate text-sm font-semibold">{account.name}</span>
      <Edit
        aria-hidden="true"
        className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      />
    </button>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  account: Account;
  onAccountUpdate: (account: Account, diff: UpdateAccountDTO) => void;
  onSetReviewDrafts?: (fn: () => void) => void;
}

const AccountDetail: React.FC<Props> = ({ account, onAccountUpdate, onSetReviewDrafts }) => {
  const defaultRange = useMemo(
    () => ({
      after: moment().subtract(90, 'days').startOf('day'),
      before: moment().endOf('day'),
    }),
    [],
  );

  const ledger = useLedger({
    updateUrl: false,
    omitTransfers: false,
    initialShowEmptyDays: false,
    initialFilters: { accounts: [account.id] },
    initialTimeframe: defaultRange,
  });

  const handleHeatmapRangeSelect = useCallback(
    (after: moment.Moment, before: moment.Moment) => {
      ledger.setTimeframe({ after, before });
    },
    [ledger],
  );

  const handleHeatmapRangeClear = useCallback(() => {
    ledger.setTimeframe(defaultRange);
  }, [ledger, defaultRange]);

  const handleLedgerReset = useCallback(() => {
    ledger.resetAll();
    ledger.setFilter('accounts', [account.id]);
  }, [ledger, account.id]);

  const handleNameSave = useCallback(
    (name: string) => onAccountUpdate(account, { name }),
    [account, onAccountUpdate],
  );

  useEffect(() => {
    onSetReviewDrafts?.(() => ledger.setFilter('isDraft', true));
  }, [onSetReviewDrafts, ledger.setFilter]);

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

  const [preset, setPreset] = useState<PresetLabel>('3M');
  const bi = account.bankIntegration;

  return (
    <div className="h-full flex flex-col min-h-0 p-4">
      {/* Hero card */}
      <Card className="mb-4 shrink-0 relative overflow-hidden animate-in fade-in-0 slide-in-from-top-3 duration-500 ease-out">
        {/* Chart fills the entire card as interactive background */}
        <BalanceHistoryChart account={account} preset={preset} />

        {/* Header content overlaid on top via gradient mask */}
        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-1.5 pb-10 bg-gradient-to-b from-card via-card/80 to-transparent pointer-events-none">
          {/* Row 1: marker + name + draft badge + balance | star + preset toggle */}
          <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
            <AccountMarker account={account} size="md" />
            <InlineName account={account} onSave={handleNameSave} />
            <AccountDraftBadge account={account} />
            <MoneyValue
              badge
              revert
              showSign
              amount={account.balance}
              currency={account.currency}
              values={account.convertedValues}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={account.isDisplayedOnSidebar ? 'Hide from sidebar' : 'Show in sidebar'}
                  className="ml-auto h-7 w-7 shrink-0"
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={toggleSidebarVisibility}
                >
                  {account.isDisplayedOnSidebar ? (
                    <Star className="h-3.5 w-3.5" />
                  ) : (
                    <StarOff className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{account.isDisplayedOnSidebar ? 'Pinned to sidebar' : 'Pin to sidebar'}</TooltipContent>
            </Tooltip>
            <ToggleGroup
              className="gap-0.5"
              size="sm"
              type="single"
              value={preset}
              onValueChange={(v) => { if (v) setPreset(v as PresetLabel); }}
            >
              {PRESETS.map((p) => (
                <ToggleGroupItem key={p.label} className="h-6 px-2 text-2xs" value={p.label}>
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Meta row: type · created [· archived] [· provider badge · syncMethod · synced] */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-muted-foreground pointer-events-auto">
            <span className="capitalize">{account.type}</span>
            <span className="select-none text-border">·</span>
            <span>Created <RelativeDatetimeDisplay date={account.createdAt} /></span>
            {account.isArchived() && (
              <>
                <span className="select-none text-border">·</span>
                <span className="text-warning">Archived {account.archivedAt?.format('D MMM YYYY')}</span>
              </>
            )}
            {bi && (
              <>
                <span className="select-none text-border">·</span>
                <span className="font-medium text-foreground/80">{capitalize(bi.provider)}</span>
                <Badge className="pointer-events-none px-1.5 py-0 text-2xs" variant={bi.isActive ? 'default' : 'destructive'}>
                  {bi.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {bi.syncMethod && (
                  <>
                    <span className="select-none text-border">·</span>
                    <span className="capitalize">{bi.syncMethod}</span>
                  </>
                )}
                {bi.lastSyncedAt && (
                  <>
                    <span className="select-none text-border">·</span>
                    <span>Synced <RelativeDatetimeDisplay date={moment(bi.lastSyncedAt)} /></span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Card>


      {/* Activity card */}
      <LedgerActivityCard
        className="flex-1 min-h-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out"
        disabledFilters={['accounts']}
        ledger={ledger}
        heatmap={({ onRangeSelect, onRangeClear }) => (
          <HeatmapPanel
            currency={account.currency}
            filters={{ accounts: [account.id] }}
            highlightDates={ledger.visibleDates}
            year={ledger.timeframe.after.year()}
            onRangeClear={onRangeClear}
            onRangeSelect={onRangeSelect}
          />
        )}
        onHeatmapRangeClear={handleHeatmapRangeClear}
        onHeatmapRangeSelect={handleHeatmapRangeSelect}
        onReset={handleLedgerReset}
      />
    </div>
  );
};

export default AccountDetail;
