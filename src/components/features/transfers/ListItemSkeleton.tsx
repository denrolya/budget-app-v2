import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ListItemSkeleton = () => (
  <Card className="my-2 border-l-4 border-l-primary shadow-md">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40 hidden sm:inline-flex" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-24 hidden sm:inline-flex" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);
