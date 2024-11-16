import React from 'react';

import { FormRenderer } from '@/components/common/FormRenderer';
import HotkeysProvider from '@/contexts/Hotkeys';
import Header from '@/components/layout/Header';
import MobileNavigation from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import FinanceDataProvider from '@/contexts/FinanceData';
import { FormProvider } from '@/contexts/Form';
import { SidebarProvider } from '@/contexts/sidebar';

export const LayoutV9: React.FC<React.PropsWithChildren> = ({ children }) => (
  <FinanceDataProvider>
    <TooltipProvider>
      <FormProvider>
        <SidebarProvider>
          <HotkeysProvider>
            <div className="flex flex-col min-h-screen">
              <Header className="fixed top-0 left-0 right-0 z-10 hidden md:flex" />

              <div className="flex flex-1 md:pt-8">
                <Sidebar className="hidden md:block overflow-y-auto fixed top-8 left-0 w-16" />

                <main className="flex-1 overflow-y-auto md:ml-16 pb-0" id="main-content" tabIndex={-1}>
                  {children}

                  <MobileNavigation />
                  <FormRenderer />
                  <Toaster />
                </main>
              </div>
            </div>
          </HotkeysProvider>
        </SidebarProvider>
      </FormProvider>
    </TooltipProvider>
  </FinanceDataProvider>
);

export default LayoutV9;
