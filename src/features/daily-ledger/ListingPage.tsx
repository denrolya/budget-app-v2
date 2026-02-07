import { CopyPlus, SquarePlus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import BulkCreateTableForm from '@/features/transactions/components/BulkCreateTableForm';

import ListingContainer, { type ListingHandle } from './components/ListingContainer';

export const DailyLedgerPage: React.FC = () => {
  const { openForm } = useFormContext();
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  const listingRef = useRef<ListingHandle | null>(null);

  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);

  const toggleBulkCreate = useCallback(() => {
    setIsBulkCreateOpen((p) => !p);
  }, []);

  const openNewTransactionForm = useCallback(() => {
    openForm(FormType.Transaction);
  }, [openForm]);

  useHotkeys('b', toggleBulkCreate, { preventDefault: true }, [toggleBulkCreate]);
  useEffect(() => {
    const hotkeys = [{ windows: 'B', mac: 'B', description: 'Toggle Bulk Create' }];
    addPageHotkeys('Daily Ledger', hotkeys);
    return () => removePageHotkeys('Daily Ledger');
  }, [addPageHotkeys, removePageHotkeys]);

  const bulkCreateAriaLabel = isBulkCreateOpen ? 'Hide bulk create' : 'Show bulk create';

  return (
    <FullHeightPageContent>
      <Card className="w-full min-w-0 shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Ledger</CardTitle>

            <div aria-label="Ledger actions" role="toolbar" className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    aria-label={bulkCreateAriaLabel}
                    aria-pressed={isBulkCreateOpen}
                    pressed={isBulkCreateOpen}
                    type="button"
                    variant="outline"
                    className="hidden md:flex"
                    onPressedChange={setIsBulkCreateOpen}
                  >
                    <CopyPlus aria-hidden="true" className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="New transaction"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={openNewTransactionForm}
                  >
                    <SquarePlus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="w-full min-w-0 p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {isBulkCreateOpen && (
            <div className="shrink-0 border-b bg-muted/50 supports-[backdrop-filter]:bg-muted/50">
              <div className="px-4 py-3">
                <BulkCreateTableForm />
              </div>
            </div>
          )}

          <ListingContainer updateUrl ref={listingRef} />
        </CardContent>
      </Card>
    </FullHeightPageContent>
  );
};

DailyLedgerPage.displayName = 'DailyLedgerPage';
export default DailyLedgerPage;
