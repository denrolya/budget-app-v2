import sumBy from 'lodash/sumBy';
import { Archive, ArchiveRestore, Focus, Search, X } from 'lucide-react';
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBaseCurrency } from '@/features/auth';
import type Debt from '@/features/debts/models/Debt';
import { useDebts } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

interface Props {
  selected: Debt | null;
  onSelect: (debt: Debt) => void;
  onClear?: () => void;
}

const SidebarListing: React.FC<Props> = ({ selected, onSelect, onClear }) => {
  const baseCurrency = useBaseCurrency();
  const debts = useDebts();

  const [showClosed, setShowClosed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchId = useId();
  const selectedDebtRef = useRef<HTMLDivElement>(null);

  const selectedId = selected ? String(selected.id) : null;

  const handleSelect = useCallback(
    (debt: Debt) => {
      const isAlreadySelected = selectedId === String(debt.id);

      if (isAlreadySelected && onClear) {
        onClear();
        return;
      }

      onSelect(debt);

      setTimeout(() => {
        selectedDebtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
    },
    [onClear, onSelect, selectedId],
  );

  const openDebts = useMemo(() => debts.filter((d) => !d.isClosed()), [debts]);
  const closedDebts = useMemo(() => debts.filter((d) => d.isClosed()), [debts]);

  const totalOpen = useMemo(
    () => sumBy(openDebts, (d) => d.convertedValues?.[baseCurrency] ?? 0),
    [openDebts, baseCurrency],
  );

  const totalClosed = useMemo(
    () => sumBy(closedDebts, (d) => d.convertedValues?.[baseCurrency] ?? 0),
    [closedDebts, baseCurrency],
  );

  const filteredDebts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const src = showClosed ? closedDebts : openDebts;

    if (!q) return src;

    return src.filter((d) => {
      const idx = `${d.debtor} ${d.currency}`.toLowerCase();
      return idx.includes(q);
    });
  }, [closedDebts, openDebts, searchTerm, showClosed]);

  const focusSelected = useCallback(() => {
    selectedDebtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const headerTotal = showClosed ? totalClosed : totalOpen;
  const headerLabel = showClosed ? 'Closed total' : 'Open total';

  return (
    <div
      aria-label="Debts list"
      className="flex h-full flex-col overflow-x-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClear) onClear();
      }}
    >
      <div className="border-b p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              aria-hidden="true"
              className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search debts"
              id={searchId}
              inputMode="search"
              placeholder={showClosed ? 'Search closed…' : 'Search open…'}
              value={searchTerm}
              className="h-9 pl-8"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div aria-label="Debt actions" role="toolbar" className="flex items-center gap-1">
            {onClear && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Clear selection"
                    disabled={!selectedId}
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => onClear()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear selection</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={showClosed ? 'Show open debts' : 'Show closed debts'}
                  aria-pressed={showClosed}
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={() => setShowClosed((v) => !v)}
                >
                  {showClosed ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showClosed ? 'Show open debts' : 'Show closed debts'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Focus selected debt"
                  disabled={!selectedId}
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={focusSelected}
                >
                  <Focus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Focus selected debt</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-2 px-1">
          <div className="text-2xs font-medium text-muted-foreground">{headerLabel}</div>
          <div className="text-xs font-semibold tabular-nums text-foreground text-right">
            <MoneyValue amount={headerTotal} currency={baseCurrency} showSign={false} />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-x-hidden">
        <div role="list" className="overflow-x-hidden">
          {filteredDebts.map((debt) => {
            const debtIdStr = String(debt.id);
            const isSelected = selectedId === debtIdStr;
            const isClosed = debt.isClosed();

            const nativeAmount = debt.balance;
            const baseAmount = debt.convertedValues?.[baseCurrency] ?? 0;
            const showBaseLine = debt.currency !== baseCurrency;

            return (
              <div
                aria-selected={isSelected}
                role="listitem"
                tabIndex={0}
                className={cn(
                  'px-3 py-2 border-b cursor-pointer',
                  'transition-colors hover:bg-accent hover:text-accent-foreground',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'overflow-x-hidden',
                  {
                    'bg-accent text-accent-foreground': isSelected,
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
                ref={isSelected ? selectedDebtRef : null}
              >
                <div className="flex items-start justify-between gap-3 min-w-0 overflow-x-hidden">
                  <div className="min-w-0 flex-1 overflow-x-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <span title={debt.debtor} className="text-sm font-medium truncate w-[120px] min-w-0">
                        {debt.debtor}
                      </span>
                      {isClosed && <span className="text-2xs text-muted-foreground shrink-0">Closed</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums leading-tight',
                        nativeAmount < 0 && 'text-destructive',
                        nativeAmount === 0 && 'text-muted-foreground',
                      )}
                    >
                      <MoneyValue
                        badge
                        amount={nativeAmount}
                        currency={debt.currency}
                        showSign={false}
                        values={!isClosed ? debt.convertedValues : undefined}
                      />
                    </span>

                    {showBaseLine && (
                      <span className="text-2xs tabular-nums leading-tight text-muted-foreground">
                        <MoneyValue amount={baseAmount} currency={baseCurrency} prefix="≈ " showSign={false} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDebts.length === 0 && (
            <div className="p-2">
              <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-2xs text-muted-foreground">
                No debts found
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidebarListing;
