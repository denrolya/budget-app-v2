import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical, Target, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import CellPopover from '@/components/common/CellPopover';
import { Input } from '@/components/ui/input';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import { cn } from '@/lib/utils';

import { type Bucket, type BucketEntry, type UnassignedEntry } from '../models/types';
import { allocationDragId, unallocatedDragId } from '../lib/dragId';

// ── Draggable entry in a bucket ──────────────────────────────────────────────

interface DraggableBucketEntryProps {
  entry: BucketEntry;
  bucketId: string;
  baseCurrency: string;
  onRemove: () => void;
  onUpdateAmount: (amount: number) => void;
}

export const DraggableBucketEntry: React.FC<DraggableBucketEntryProps> = ({
  entry,
  bucketId,
  baseCurrency,
  onRemove,
  onUpdateAmount,
}) => {
  const [editValue, setEditValue] = useState('');

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: allocationDragId(entry.account.id, bucketId),
  });

  const sym = CURRENCIES[entry.account.currency as CURRENCY_CODE]?.symbol ?? entry.account.currency;
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      style={style}
      className={cn(
        'flex items-center gap-1 rounded border bg-background px-1 py-0.5 select-none transition-opacity',
        isDragging && 'opacity-40',
      )}
      ref={setNodeRef}
      {...attributes}
    >
      <span {...listeners} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab shrink-0">
        <GripVertical className="h-3 w-3" />
      </span>

      <Link
        to="/accounts"
        className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <AccountMarker account={entry.account} size="sm" />
        <span className="text-xs truncate leading-none">{entry.account.name}</span>
      </Link>

      <div onPointerDown={(e) => e.stopPropagation()}>
        <CellPopover
          trigger={
            <div className="text-right">
              <div className="text-xs font-semibold tabular-nums leading-tight">
                {sym}
                {entry.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              {entry.account.currency !== baseCurrency && (
                <div className="text-2xs text-muted-foreground tabular-nums leading-tight">
                  ≈{baseSym}
                  {entry.allocatedBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              )}
            </div>
          }
          contentClassName="w-56"
          onCancel={() => setEditValue(String(Math.round(entry.amount)))}
          onOpen={() => setEditValue(String(Math.round(entry.amount)))}
          onSave={() => {
            const n = parseFloat(editValue);
            if (!isNaN(n) && n > 0) onUpdateAmount(n);
          }}
        >
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium">{entry.account.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Balance: {sym}
                {Math.abs(entry.account.balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground shrink-0">{sym}</span>
              <Input
                autoFocus
                max={entry.maxAmount}
                min={1}
                type="number"
                value={editValue}
                className="h-7 text-sm"
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Max: {sym}
              {entry.maxAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </CellPopover>
      </div>

      <button
        aria-label={`Remove ${entry.account.name} from bucket`}
        type="button"
        className="shrink-0 text-muted-foreground/40 hover:text-destructive"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

// ── Draggable unassigned item ────────────────────────────────────────────────

interface DraggableUnassignedItemProps {
  entry: UnassignedEntry;
  baseCurrency: string;
}

export const DraggableUnassignedItem: React.FC<DraggableUnassignedItemProps> = ({ entry, baseCurrency }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unallocatedDragId(entry.account.id),
  });

  const sym = CURRENCIES[entry.account.currency as CURRENCY_CODE]?.symbol ?? entry.account.currency;
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      style={style}
      className={cn(
        'flex items-center gap-1 rounded border bg-background px-1 py-0.5 select-none transition-opacity cursor-grab',
        isDragging && 'opacity-40',
      )}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      <Link
        to="/accounts"
        className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <AccountMarker account={entry.account} size="sm" />
        <span className="text-xs truncate leading-none">{entry.account.name}</span>
      </Link>
      {entry.isPartial && <span className="shrink-0 text-2xs text-warning">partial</span>}
      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
        {baseSym}
        {entry.unallocatedBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        {entry.account.currency !== baseCurrency && (
          <span className="opacity-60">
            {' '}
            {sym}
            {Math.abs(entry.unallocatedAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        )}
      </span>
    </div>
  );
};

// ── DragOverlay item ─────────────────────────────────────────────────────────

interface OverlayItemProps {
  label: string;
  baseCurrency: string;
  balance: number;
  pctLabel?: string;
}

export const DragOverlayItem: React.FC<OverlayItemProps> = ({ label, baseCurrency, balance, pctLabel }) => {
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background shadow-lg px-2 py-1.5 text-xs cursor-grabbing opacity-90 select-none">
      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      <span className="font-medium">{label}</span>
      {pctLabel && <span className="text-2xs text-warning">{pctLabel}</span>}
      <span className="text-muted-foreground tabular-nums">
        {baseSym}
        {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
};

// ── Droppable bucket zone ────────────────────────────────────────────────────

interface BucketZoneProps {
  bucket: Bucket;
  entries: BucketEntry[];
  baseCurrency: string;
  totalBalance: number;
  onRemove: (accountId: number) => void;
  onUpdateAmount: (accountId: number, amount: number) => void;
  onSetTarget: (amount: number | null) => void;
}

export const DroppableBucketZone: React.FC<BucketZoneProps> = ({
  bucket,
  entries,
  baseCurrency,
  totalBalance,
  onRemove,
  onUpdateAmount,
  onSetTarget,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id });
  const [targetEditValue, setTargetEditValue] = useState('');

  const bucketTotal = entries.reduce((s, e) => s + e.allocatedBalance, 0);
  const pct = totalBalance > 0 ? (bucketTotal / totalBalance) * 100 : 0;
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;
  const target = bucket.targetAmount ?? null;
  const targetPct = target && target > 0 ? Math.min((bucketTotal / target) * 100, 100) : null;

  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-card',
      )}
      ref={setNodeRef}
    >
      {/* Bucket header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{bucket.emoji}</span>
          <span className="text-xs font-semibold">{bucket.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Target edit button */}
          <div onPointerDown={(e) => e.stopPropagation()}>
            <CellPopover
              trigger={
                <span
                  aria-label="Set target"
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    target
                      ? 'text-primary/70 hover:text-primary'
                      : 'text-muted-foreground/30 hover:text-muted-foreground',
                  )}
                >
                  <Target className="h-3 w-3" />
                </span>
              }
              contentClassName="w-52"
              onCancel={() => setTargetEditValue(target ? String(Math.round(target)) : '')}
              onOpen={() => setTargetEditValue(target ? String(Math.round(target)) : '')}
              onSave={() => {
                const n = parseFloat(targetEditValue);
                onSetTarget(n > 0 ? n : null);
              }}
            >
              <div className="space-y-2">
                <p className="text-xs font-medium">Target amount ({baseCurrency})</p>
                <p className="text-[10px] text-muted-foreground">Set a funding goal for this bucket</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground shrink-0">{baseSym}</span>
                  <Input
                    autoFocus
                    min={0}
                    placeholder="e.g. 15000"
                    type="number"
                    value={targetEditValue}
                    className="h-7 text-sm"
                    onChange={(e) => setTargetEditValue(e.target.value)}
                  />
                </div>
                {target && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => {
                      onSetTarget(null);
                      setTargetEditValue('');
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Clear target
                  </button>
                )}
              </div>
            </CellPopover>
          </div>

          {bucketTotal > 0 && (
            <div className="text-right">
              <div className="text-xs font-semibold tabular-nums leading-tight">
                {baseSym}
                {bucketTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                {target && (
                  <span className="text-2xs font-normal text-muted-foreground ml-1">
                    / {baseSym}
                    {target.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
              {target ? (
                <div className="mt-0.5 w-full h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    style={{ width: `${targetPct}%` }}
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      targetPct! >= 100 ? 'bg-success' : targetPct! >= 60 ? 'bg-warning' : 'bg-destructive/70',
                    )}
                  />
                </div>
              ) : (
                <div className="text-2xs text-muted-foreground">{pct.toFixed(1)}%</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="p-1 space-y-0.5 min-h-[36px]">
        {[...entries]
          .sort((a, b) => b.allocatedBalance - a.allocatedBalance)
          .map((entry) => (
            <DraggableBucketEntry
              baseCurrency={baseCurrency}
              bucketId={bucket.id}
              entry={entry}
              key={entry.account.id}
              onRemove={() => onRemove(entry.account.id)}
              onUpdateAmount={(amount) => onUpdateAmount(entry.account.id, amount)}
            />
          ))}
        {entries.length === 0 && (
          <div
            className={cn(
              'flex items-center justify-center h-7 rounded text-2xs text-muted-foreground border border-dashed transition-colors',
              isOver ? 'border-primary text-primary' : 'border-border',
            )}
          >
            Drop account here
          </div>
        )}
      </div>
    </div>
  );
};

// ── Droppable unassigned zone ────────────────────────────────────────────────

interface UnassignedZoneProps {
  entries: UnassignedEntry[];
  baseCurrency: string;
  totalBalance: number;
}

export const DroppableUnassignedZone: React.FC<UnassignedZoneProps> = ({ entries, baseCurrency }) => {
  const { setNodeRef, isOver } = useDroppable({ id: '__unassigned__' });

  if (entries.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30',
      )}
      ref={setNodeRef}
    >
      <div className="px-2 py-1 border-b border-border/40">
        <span className="text-xs font-semibold text-muted-foreground">📦 Unassigned</span>
      </div>
      <div className="p-1 space-y-0.5">
        {entries.map((entry) => (
          <DraggableUnassignedItem baseCurrency={baseCurrency} entry={entry} key={entry.account.id} />
        ))}
      </div>
    </div>
  );
};
