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
      <MoneyValue className="font-bold font-mono antialiased" useColors={useColors} amount={value} />
    </Badge>

    {count > 0 && (
      <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center z-50 pointer-events-none">
        {count}
      </div>
    )}
  </div>
);

export default memo(SummaryBadge);
