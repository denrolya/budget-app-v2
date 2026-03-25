import { X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { type Transaction, TransactionDetails } from '@/features/transactions';
import { Transfer, TransferDetails } from '@/features/transfers';

interface Props {
  item: Transaction | Transfer;
  onClose: () => void;
}

const isXfr = (item: Transaction | Transfer): item is Transfer =>
  item instanceof Transfer || 'fromExpense' in (item as object);

const ItemDetailPanel: React.FC<Props> = ({ item, onClose }) => {
  const transfer = isXfr(item) ? item : null;
  const tx = transfer ? null : (item as Transaction);
  const typeLabel = transfer ? 'Transfer' : 'Transaction';

  const details = transfer ? <TransferDetails transfer={transfer} /> : <TransactionDetails transaction={tx!} />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-10 shrink-0 flex items-center gap-2 px-4 border-b">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-muted/60 text-muted-foreground border-border">
          {typeLabel}
        </span>
        <code className="text-xs text-muted-foreground/60 font-mono">#{item.id}</code>
        <Button
          aria-label="Close detail panel"
          size="icon"
          variant="ghost"
          className="ml-auto h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">{details}</div>

      {/* Keyboard hint */}
      <div className="shrink-0 border-t px-4 py-1.5 flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground/40 font-mono">
          ↑↓ navigate · Esc close · E edit · D draft
        </span>
      </div>
    </div>
  );
};

ItemDetailPanel.displayName = 'ItemDetailPanel';
export default ItemDetailPanel;
