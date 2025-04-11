import { Moment } from 'moment/moment';
import React from 'react';

import { Separator } from '@/components/ui/separator';
import { MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import MoneyValue from '@/components/common/MoneyValue';
import { ComparisonType } from '@/types/statistics';
import { formatShortDate } from '@/utils/formatShortDate';

const TooltipContent: React.FC<{
  label: string;
  amount: number;
  date?: Moment;
  selectedTimeframe: { after: Moment; before: Moment };
  comparisonTimeframe: { after: Moment; before: Moment };
  comparison: ComparisonType;
}> = ({ label, amount, date, selectedTimeframe, comparisonTimeframe, comparison }) => (
  <>
    <div className="flex justify-between items-center">
      <p className="text-xs font-medium">
        {formatShortDate(selectedTimeframe.after)} - {formatShortDate(selectedTimeframe.before)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatShortDate(comparisonTimeframe.after)} - {formatShortDate(comparisonTimeframe.before)}
      </p>
    </div>
    <Separator className="my-2" />
    <h3 className="font-semibold text-sm">{label}</h3>
    <p className="text-base font-bold">
      <MoneyValue className="font-medium font-mono" useColors={false} amount={amount} />
    </p>
    {date && <p className="text-muted-foreground">Date: {date.format(MOMENT_DATE_VIEW_FORMAT)}</p>}
    <Separator className="my-2" />
    <p className="pt-1">vs {comparison === 'previous' ? 'previous period' : 'same period last year'}</p>
  </>
);

export default TooltipContent;
