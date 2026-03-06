import React from 'react';

import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
  colSpan?: number;
  compact?: boolean;
  /** Extra classes applied to the outer TableRow */
  rowClassName?: string;
  /** Extra classes applied to the inner TableCell */
  cellClassName?: string;
  /** Left slot — typically the date display */
  left: React.ReactNode;
  /** Right slot — typically summary badge(s) */
  right?: React.ReactNode;
}

/**
 * Reusable date-group header row for all table listings.
 * Rendered once per date bucket, spans all columns.
 */
const DateGroupHeaderRow: React.FC<Props> = ({
  colSpan = 8,
  compact,
  rowClassName,
  cellClassName,
  left,
  right,
}) => (
  <TableRow className={rowClassName}>
    <TableCell colSpan={colSpan} className={cn('px-4', compact && 'py-0', cellClassName)}>
      <div className="flex items-center justify-between gap-2">
        {left}
        {right != null && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </TableCell>
  </TableRow>
);

DateGroupHeaderRow.displayName = 'DateGroupHeaderRow';

export default DateGroupHeaderRow;
