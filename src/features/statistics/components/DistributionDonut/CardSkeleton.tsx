import { Skeleton } from '@/components/ui/skeleton';

const CardSkeleton: React.FC = () => (
  <div className="flex flex-col h-full min-h-0">
    {/* Donut placeholder — matches real h-[180px] chart area */}
    <div className="shrink-0 h-[180px] flex items-center justify-center">
      <div className="relative w-[156px] h-[156px]">
        <Skeleton className="w-full h-full rounded-full" />
        {/* Hollow center to simulate donut */}
        <div className="absolute inset-0 m-[40px] rounded-full bg-card" />
      </div>
    </div>

    <div className="border-t shrink-0" />

    {/* List rows — matches DistributionList row anatomy */}
    <div className="flex-1 py-1">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div className="flex items-center gap-2 px-2 py-1" key={idx}>
          <Skeleton className="h-2 w-2 rounded-full shrink-0" />
          <Skeleton className="h-3 flex-[2]" />
          <Skeleton className="h-1 flex-[3] rounded-full" />
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="h-3 w-7 shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export default CardSkeleton;
