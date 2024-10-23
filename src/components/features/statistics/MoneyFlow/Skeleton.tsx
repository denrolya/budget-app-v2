import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export const MoneyFlowSkeleton: React.FC = () => (
  <>
    <div className="h-[250px] mb-2">
      <Skeleton className="w-full h-full" />
    </div>

    <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:justify-between p-3 border-t">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:flex-1 lg:grid-cols-4 w-full">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex flex-col">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="w-full lg:w-1/5">
        <div className="flex flex-col">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  </>
);

export default MoneyFlowSkeleton;
