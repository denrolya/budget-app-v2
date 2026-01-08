import React from 'react';

import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrencyConverterProvider } from '@/contexts/CurrencyConverter';
import { FormProvider } from '@/contexts/Form';
import { HotkeysProvider } from '@/contexts/Hotkeys';

const AppProviders = ({ children }: React.PropsWithChildren) => (
  <TooltipProvider>
    <FormProvider>
      <SidebarProvider defaultOpen={false} className="overflow-hidden">
        <CurrencyConverterProvider>
          <HotkeysProvider>
            {children}
            <Toaster />
          </HotkeysProvider>
        </CurrencyConverterProvider>
      </SidebarProvider>
    </FormProvider>
  </TooltipProvider>
);

export default AppProviders;
