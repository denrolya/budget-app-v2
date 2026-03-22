import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export const MoneyFlowSkeleton: React.FC = () => (
  <div className="flex-1 min-h-0">
    <Skeleton className="w-full h-full" />
  </div>
);

export default MoneyFlowSkeleton;
