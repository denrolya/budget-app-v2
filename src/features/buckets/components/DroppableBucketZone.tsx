import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical, X } from 'lucide-react';
import React, { useState } from 'react';

import CellPopover from '@/components/common/CellPopover';
import { Input } from '@/components/ui/input';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { cn } from '@/lib/utils';

import { Bucket, BucketEntry, UnassignedEntry } from '../models/types';

// ── Drag ID helpers ─────────────────────────────────────────────────────────

/** accountId dragged from unassigned zone */
export const unallocatedDragId = (accountId: number) => `unallocated:${accountId}`;
/** specific bucket allocation dragged */
export const allocationDragId = (accountId: number, bucketId: string) =>
  `allocation:${accountId}:${bucketId}`;

export function parseDragId(id: string):
  | { type: 'unallocated'; accountId: number }
  | { type: 'allocation'; accountId: number; bucketId: string }
  | null {
  if (id.startsWith('unallocated:')) {
    return { type: 'unallocated', accountId: Number(id.slice(12)) };
  }
  if (id.startsWith('allocation:')) {
    const rest = id.slice(11); // "accountId:bucketId"
    const colon = rest.indexOf(':');
    if (colon === -1) return null;
    return {
      type: 'allocation',
      accountId: Number(rest.slice(0, colon)),
      bucketId: rest.slice(colon + 1),
    };
  }
  return null;
}

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
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-2 select-none transition-opacity',
        isDragging && 'opacity-40',
      )}
      {...attributes}
    >
      <span
        {...listeners}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab shrink-0"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>

      <span className="flex-1 truncate text-sm font-medium">{entry.account.name}</span>

      <div onPointerDown={(e) => e.stopPropagation()}>
        <CellPopover
          trigger={
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums">
                {sym}
                {entry.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              {entry.account.currency !== baseCurrency && (
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  ≈{baseSym}
                  {entry.allocatedBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              )}
            </div>
          }
          onOpen={() => setEditValue(String(Math.round(entry.amount)))}
          onSave={() => {
            const n = parseFloat(editValue);
            if (!isNaN(n) && n > 0) onUpdateAmount(n);
          }}
          onCancel={() => setEditValue(String(Math.round(entry.amount)))}
          contentClassName="w-56"
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
                type="number"
                min={1}
                max={entry.maxAmount}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 text-sm"
                autoFocus
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
        type="button"
        aria-label={`Remove ${entry.account.name} from bucket`}
        className="ml-0.5 shrink-0 text-muted-foreground/40 hover:text-destructive"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// ── Draggable unassigned item ────────────────────────────────────────────────

interface DraggableUnassignedItemProps {
  entry: UnassignedEntry;
  baseCurrency: string;
}

export const DraggableUnassignedItem: React.FC<DraggableUnassignedItemProps> = ({
  entry,
  baseCurrency,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unallocatedDragId(entry.account.id),
  });

  const sym = CURRENCIES[entry.account.currency as CURRENCY_CODE]?.symbol ?? entry.account.currency;
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-2 select-none transition-opacity cursor-grab',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <span className="flex-1 truncate text-sm font-medium">{entry.account.name}</span>
      {entry.isPartial && (
        <span className="shrink-0 text-[10px] text-amber-500">partial</span>
      )}
      <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
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
    <div className="flex items-center gap-2 rounded-md border bg-background shadow-lg px-2 py-2 text-sm cursor-grabbing opacity-90 select-none">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <span className="font-medium">{label}</span>
      {pctLabel && <span className="text-[10px] text-amber-500">{pctLabel}</span>}
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
}

export const DroppableBucketZone: React.FC<BucketZoneProps> = ({
  bucket,
  entries,
  baseCurrency,
  totalBalance,
  onRemove,
  onUpdateAmount,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id });

  const bucketTotal = entries.reduce((s, e) => s + e.allocatedBalance, 0);
  const pct = totalBalance > 0 ? (bucketTotal / totalBalance) * 100 : 0;
  const baseSym = CURRENCIES[baseCurrency as CURRENCY_CODE]?.symbol ?? baseCurrency;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-card',
      )}
    >
      {/* Bucket header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{bucket.emoji}</span>
          <span className="text-sm font-semibold">{bucket.name}</span>
        </div>
        {bucketTotal > 0 && (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums">
              {baseSym}
              {bucketTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% of portfolio</div>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="p-2 space-y-1.5 min-h-[52px]">
        {entries.map((entry) => (
          <DraggableBucketEntry
            key={entry.account.id}
            entry={entry}
            bucketId={bucket.id}
            baseCurrency={baseCurrency}
            onRemove={() => onRemove(entry.account.id)}
            onUpdateAmount={(amount) => onUpdateAmount(entry.account.id, amount)}
          />
        ))}
        {entries.length === 0 && (
          <div
            className={cn(
              'flex items-center justify-center h-9 rounded text-xs text-muted-foreground border border-dashed transition-colors',
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

export const DroppableUnassignedZone: React.FC<UnassignedZoneProps> = ({
  entries,
  baseCurrency,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: '__unassigned__' });

  if (entries.length === 0) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30',
      )}
    >
      <div className="px-3 py-2 border-b border-border/40">
        <span className="text-sm font-semibold text-muted-foreground">📦 Unassigned</span>
      </div>
      <div className="p-2 space-y-1.5">
        {entries.map((entry) => (
          <DraggableUnassignedItem
            key={entry.account.id}
            entry={entry}
            baseCurrency={baseCurrency}
          />
        ))}
      </div>
    </div>
  );
};
