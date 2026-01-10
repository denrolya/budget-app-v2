import { Skeleton } from '@/components/ui/skeleton';

export const CategoriesDoughnutCardSkeleton: React.FC<React.ComponentPropsWithoutRef<'div'>> = () => (
  <div className="flex flex-col">
    <div className="w-64 md:w-96 h-64 md:h-96">
      <Skeleton className="w-full h-full rounded-full" />
    </div>
    <div className="w-full mt-4 md:mt-0 md:ml-4">
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <div className="flex items-center justify-between" key={index}>
            <Skeleton className="h-4 w-1/3" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CategoriesDoughnutCardSkeleton;
