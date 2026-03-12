import { type Moment } from 'moment/moment';
import React, { useMemo } from 'react';

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { MOMENT_DATEPICKER_FORMAT } from '@/constants/datetime';
import { type Category } from '@/features/categories';
import { LedgerView, useLedger } from '@/features/ledger';
import { useCategories } from '@/hooks/financeData';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: number[];
  timeframe: {
    after: Moment;
    before: Moment;
  };
  fetchFromSubcategories?: boolean;
}

type DrawerListingProps = {
  categories: number[];
  timeframe: { after: Moment; before: Moment };
  fetchFromSubcategories: boolean;
};

const DrawerListing: React.FC<DrawerListingProps> = ({ categories, timeframe, fetchFromSubcategories }) => {
  const ledger = useLedger({
    updateUrl: false,
    omitTransfers: true,
    initialFilters: {
      categories,
      withNestedCategories: fetchFromSubcategories,
    },
    initialTimeframe: timeframe,
  });

  return <LedgerView showControls disabledFilters={['categories']} enableHotkeys={false} ledger={ledger} />;
};

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedCategories,
  timeframe,
  fetchFromSubcategories = true,
}) => {
  const { list: allCategories } = useCategories();
  const categories = selectedCategories
    .map((id) => allCategories.find((category: Category) => category.id === id))
    .filter((c): c is Category => c !== undefined);

  const listingKey = useMemo(
    () => `${selectedCategories.join(',')}:${timeframe.after.valueOf()}-${timeframe.before.valueOf()}`,
    [selectedCategories, timeframe.after, timeframe.before],
  );

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Transactions in {categories.map((c) => c.name).join(', ')}</DrawerTitle>
          <DrawerDescription>
            {timeframe.after.format(MOMENT_DATEPICKER_FORMAT)} - {timeframe.before.format(MOMENT_DATEPICKER_FORMAT)}
          </DrawerDescription>
        </DrawerHeader>
        <div className="h-[60vh] min-h-0 flex flex-col">
          <DrawerListing
            categories={selectedCategories}
            fetchFromSubcategories={fetchFromSubcategories}
            timeframe={timeframe}
            key={listingKey}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionsDrawer;
