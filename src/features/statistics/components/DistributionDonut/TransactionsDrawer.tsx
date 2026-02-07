import type { Moment } from 'moment';
import React, { useMemo } from 'react';

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import ListingContainer from '@/features/daily-ledger/components/ListingContainer';

export type DrawerListingTarget = {
  title: string;
  initialFilters: Record<string, unknown>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: DrawerListingTarget | null;
  timeframe: { after: Moment; before: Moment };
};

export const TransactionsDrawer: React.FC<Props> = ({ open, onOpenChange, target, timeframe }) => {
  const listingKey = useMemo(() => {
    if (!target) return 'none';
    return `${target.title}:${timeframe.after.valueOf()}-${timeframe.before.valueOf()}`;
  }, [target, timeframe.after, timeframe.before]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{target?.title ?? 'Transactions'}</DrawerTitle>
          <DrawerDescription>
            {timeframe.after.format('DD MMM YYYY')} - {timeframe.before.format('DD MMM YYYY')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="h-[80vh] min-h-0 flex flex-col">
          {target ? (
            <ListingContainer
              enableHotkeys={false}
              excludeTransfers={false}
              initialFilters={target.initialFilters}
              initialTimeframe={timeframe}
              updateUrl={false}
              key={listingKey}
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionsDrawer;
