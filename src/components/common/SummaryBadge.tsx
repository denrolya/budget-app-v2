import { LucideIcon } from 'lucide-react';
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
  <div className="relative inline-flex" {...props}>
    <Badge variant="outline" className="text-xs py-1 pl-2 pr-3 flex items-center space-x-2 bg-background">
      <Icon className="h-3.5 w-3.5" />
      <MoneyValue amount={value} useColors={useColors} className="leading-none whitespace-nowrap tracking-tighter font-mono antialiased" />
    </Badge>

    {count > 0 && (
      <Badge
        variant={count > 0 ? 'default' : 'secondary'}
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-medium rounded-full"
      >
        {count}
      </Badge>
    )}
  </div>
);

export default memo(SummaryBadge);
