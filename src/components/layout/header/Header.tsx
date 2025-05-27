import React from 'react';

import ExchangeRatesDetails from '@/components/layout/header/ExchangeRatesDetails';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}


export const Header: React.FC<Props> = ({ className }) => (
  <header
    className={cn(
      'group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear',
      className,
    )}
  >
    <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
      <SidebarTrigger className="-ml-1" />
    </div>

    <div className="flex items-center space-x-2">
      <nav className="hidden md:flex space-x-4"></nav>
    </div>

    <div className="flex items-center space-x-2 md:space-x-4 px-4">
      <ExchangeRatesDetails />
    </div>
  </header>
);

Header.displayName = 'Header';

export default Header;
