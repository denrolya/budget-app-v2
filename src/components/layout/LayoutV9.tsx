import React from 'react';

import { FormRenderer } from '@/components/common/FormRenderer';
import Header from '@/components/layout/header/Header';
import MobileNavigation from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/sidebar/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import FinanceDataProvider from '@/contexts/FinanceData';
import { FormProvider } from '@/contexts/Form';
import HotkeysProvider from '@/contexts/Hotkeys';

export const LayoutV9: React.FC<React.PropsWithChildren> = ({ children }) => (
  <FinanceDataProvider>
    <TooltipProvider>
      <FormProvider>
        <SidebarProvider defaultOpen={false} className="overflow-hidden">
          <HotkeysProvider>
            <Sidebar />
            <SidebarInset>
              <div className="flex flex-col h-screen">
                <Header className="hidden md:flex" />

                <main className="flex flex-col h-full md:overflow-hidden bg-background">{children}</main>

                <MobileNavigation />
                <FormRenderer />
                <Toaster />
              </div>
            </SidebarInset>
          </HotkeysProvider>
        </SidebarProvider>
      </FormProvider>
    </TooltipProvider>
  </FinanceDataProvider>
);

export default LayoutV9;
