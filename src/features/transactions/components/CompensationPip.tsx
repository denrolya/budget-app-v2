import React from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { formatMoney } from '@/lib/formatMoney';
import { cn } from '@/lib/utils';

import type Transaction from '../models/Transaction';

import ListItem from './ListItem';

interface Props {
  transaction: Transaction;
}

const CompensationPip: React.FC<Props> = ({ transaction }) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];

  const expenseBase = transaction.convertedValues?.[baseCurrencyCode] ?? 0;
  const compensationsTotal = (transaction.compensations ?? []).reduce(
    (sum, c) => sum + (c.convertedValues?.[baseCurrencyCode] ?? 0),
    0,
  );
  const net = expenseBase + compensationsTotal;
  const netFormatted = `${baseCurrency.symbol} ${formatMoney(Math.abs(net), baseCurrencyCode)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="View compensation details"
          type="button"
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warning cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning"
          onPointerDown={(e) => e.stopPropagation()}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="p-2 w-72">
        <p className="text-2xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Compensations</p>
        <div className="space-y-0.5">
          {transaction.compensations!.map((comp) => (
            <ListItem flat transaction={comp} key={comp.id} />
          ))}
        </div>
        <div className="border-t mt-1.5 pt-1.5 flex justify-between items-center">
          <span className="text-2xs font-mono text-muted-foreground">net</span>
          <span
            className={cn('text-2xs font-mono tabular-nums', {
              'text-destructive': net < 0,
              'text-success': net >= 0,
            })}
          >
            {netFormatted}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CompensationPip;
