import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListItemSkeleton as TransactionListItemSkeleton } from '@/components/features/transactions/ListItemV3';
import { ListItemSkeleton as TransferListItemSkeleton } from '@/components/features/transfers/ListItem';

export const ListSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((group) => (
        <Card key={group} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-40" />
            </CardTitle>
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-4">
                <div className="w-1/2">
                  <TransactionListItemSkeleton />
                </div>
                <div className="w-1/2">
                  <TransferListItemSkeleton />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );

export default ListSkeleton;
