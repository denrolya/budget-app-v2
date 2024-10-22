import React from 'react';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const MoneyFlowSkeleton: React.FC = () => (
  <Card className="w-full">
    <CardContent className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-[60px]" />
          <Skeleton className="h-7 w-[70px]" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>

      <div className="mb-2">
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="h-[250px] mb-2">
        <Skeleton className="w-full h-full" />
      </div>
    </CardContent>

    <CardFooter className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:justify-between p-3 border-t">
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
    </CardFooter>
  </Card>
);

export default MoneyFlowSkeleton;
