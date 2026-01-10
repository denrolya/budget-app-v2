import { Skeleton } from '@/components/ui/skeleton';

const CardSkeleton: React.FC = () => (
  <div className="flex flex-col h-full min-w-0">
    <div className="w-full h-64 md:h-96 flex items-center justify-center">
      <div className="w-full max-w-[360px] md:max-w-[420px] aspect-square">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
    </div>

    <div className="mt-4 space-y-2">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div className="flex items-center justify-between gap-3" key={idx}>
          <div className="flex items-center gap-2 min-w-0">
            <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
            <Skeleton className="h-4 w-44 max-w-[60%]" />
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CardSkeleton;
