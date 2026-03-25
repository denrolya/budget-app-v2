import { type LucideIcon } from 'lucide-react';
import React, { memo } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Badge } from '@/components/ui/badge';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  count: number;
  value: number;
  icon: LucideIcon;
  useColors?: boolean;
}

const SummaryBadge: React.FC<Props> = ({ count, value, icon: Icon, useColors = true, ...props }) => (
  <div className="inline-flex" {...props}>
    <Badge variant="outline" className="text-xs py-1 pl-2 pr-3 flex items-center gap-1.5 bg-background">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {count > 0 && (
        <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums leading-none">{count}×</span>
      )}
      <MoneyValue
        amount={value}
        useColors={useColors}
        className="leading-none whitespace-nowrap tracking-tighter font-mono antialiased"
      />
    </Badge>
  </div>
);

export default memo(SummaryBadge);
