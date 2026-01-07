import { Archive, Calendar, Search } from 'lucide-react';
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import MoneyValue from '@/components/common/MoneyValue';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Debt from '@/features/debts/models/Debt';
import { useDebts } from '@/hooks/financeData';

interface Props {
  selected: Debt | null;
  onSelect: (debt: Debt) => void;
  onClear?: () => void;
}

const SidebarListing: React.FC<Props> = ({ selected, onSelect, onClear }) => {
  const debts = useDebts();

  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedRef = useRef<HTMLDivElement>(null);
  const searchId = useId();

  const handleSelect = useCallback(
    (debt: Debt) => {
      const isAlreadySelected = selected?.id === debt.id;

      if (isAlreadySelected && onClear) {
        onClear();
        return;
      }

      onSelect(debt);

      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
    },
    [onClear, onSelect, selected?.id],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return debts.filter((d) => {
      const isClosed = d.isClosed();
      if (!showArchived && isClosed) return false;

      if (!q) return true;

      // matches accounts approach: simple index string
      const idx = `${d.debtor} ${d.currency}`.toLowerCase();
      return idx.includes(q);
    });
  }, [debts, searchTerm, showArchived]);

  return (
    <div
      aria-label="Debts sidebar"
      className="flex h-full flex-col overflow-x-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClear) onClear();
      }}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Debts</h2>

        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search debts
          </label>
          <Search aria-hidden="true" className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search debts"
            id={searchId}
            inputMode="search"
            placeholder="Search debts"
            value={searchTerm}
            className="pl-8"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-x-hidden">
        <div role="list" className="overflow-x-hidden">
          {filtered.map((debt) => {
            const isSelected = selected?.id === debt.id;
            const isClosed = debt.isClosed();

            return (
              <div
                aria-selected={isSelected}
                role="listitem"
                tabIndex={0}
                className={cn(
                  'px-4 py-3 border-b cursor-pointer',
                  'transition-colors hover:bg-accent',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'overflow-x-hidden',
                  {
                    'bg-accent': isSelected,
                    'opacity-70': isClosed && !isSelected,
                  },
                )}
                key={debt.id}
                onClick={() => handleSelect(debt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(debt);
                  }
                }}
                ref={isSelected ? selectedRef : null}
              >
                <div className="flex items-start justify-between gap-3 min-w-0 overflow-x-hidden">
                  {/* LEFT: must be min-w-0 so it can truncate */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span title={debt.debtor} className="font-medium truncate">
                        {debt.debtor}
                      </span>

                      {isClosed && (
                        <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground shrink-0">
                          <Archive aria-hidden="true" className="h-3 w-3" />
                          Closed
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-2xs text-muted-foreground flex items-center gap-1 min-w-0">
                      <Calendar aria-hidden="true" className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        Last updated: {debt.updatedAt ? debt.updatedAt.fromNow() : '—'}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT: shrink-0 so it never disappears */}
                  <div className="shrink-0 text-right">
                    <MoneyValue
                      badge
                      amount={debt.balance}
                      currency={debt.currency}
                      values={debt.convertedValues}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="p-4">
            <button
              aria-label={showArchived ? 'Hide closed debts' : 'Show closed debts'}
              aria-pressed={showArchived}
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? 'Hide Closed' : 'Show Closed'}
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidebarListing;
