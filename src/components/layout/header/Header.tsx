import { CopyPlus } from 'lucide-react';
import React from 'react';

import ExchangeRatesDetails from '@/components/layout/header/ExchangeRatesDetails';
import NavUser from '@/components/layout/sidebar/NavUser';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { cn } from '@/lib/utils';

import { usePageHeader } from './PageHeaderContext';

interface Props {
  className?: string;
}

export const Header: React.FC<Props> = ({ className }) => {
  const { openForm } = useFormContext();
  const { title, headerSlot } = usePageHeader();

  return (
    <header
      className={cn(
        'group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[height] ease-linear overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center gap-1 px-4 shrink-0">
        <SidebarTrigger className="-ml-1" />
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2 px-2 overflow-hidden">
        {title ? <h1 className="text-sm font-semibold tracking-tight truncate shrink-0">{title}</h1> : null}
        {headerSlot && <div className="flex-1 min-w-0 flex items-center">{headerSlot}</div>}
      </div>

      <div className="flex items-center gap-1 px-4 shrink-0">
        <nav className="hidden md:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Bulk create transactions"
                size="icon"
                variant="ghost"
                onClick={() => openForm(FormType.BulkTransaction)}
              >
                <CopyPlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bulk Create Transactions (Shift+B)</TooltipContent>
          </Tooltip>
        </nav>
        <ExchangeRatesDetails />
        <NavUser />
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;
