import type { Moment } from 'moment';
import React, { useMemo } from 'react';

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { LedgerView, useLedger } from '@/features/daily-ledger';

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

type DrawerContentProps = {
  target: DrawerListingTarget;
  timeframe: { after: Moment; before: Moment };
};

const DrawerListing: React.FC<DrawerContentProps> = ({ target, timeframe }) => {
  const ledger = useLedger({
    updateUrl: false,
    initialFilters: target.initialFilters,
    initialTimeframe: timeframe,
  });
  return <LedgerView enableHotkeys={false} ledger={ledger} showControls />;
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
          {target && <DrawerListing target={target} timeframe={timeframe} key={listingKey} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionsDrawer;
