import React from 'react';

import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrencyConverterProvider } from '@/contexts/CurrencyConverter';
import { FormProvider } from '@/contexts/Form';
import HotkeysProvider from '@/contexts/Hotkeys';

const AppProviders = ({ children }: React.PropsWithChildren) => (
  <TooltipProvider>
    {/* keep Toaster high so it doesn't get unmounted by provider churn */}
    <Toaster />

    {/* put HotkeysProvider higher to eliminate "missing provider" transient renders */}
    <FormProvider>
      <CurrencyConverterProvider>
        <SidebarProvider defaultOpen={false} className="overflow-hidden">
          <HotkeysProvider>
            {children}
          </HotkeysProvider>
        </SidebarProvider>
      </CurrencyConverterProvider>
    </FormProvider>
  </TooltipProvider>
);

export default AppProviders;
