import React from 'react';

import { FormRenderer } from '@/components/common/FormRenderer';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceDataProvider } from '@/contexts/FinanceData';
import { FormProvider } from '@/contexts/Form';
import { SidebarProvider } from '@/contexts/sidebar';

export const LayoutV9: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FinanceDataProvider>
    <TooltipProvider>
      <FormProvider>
        <SidebarProvider>
          <div className="flex flex-col bg-background min-h-screen md:h-screen md:overflow-hidden">
            <Header className="hidden md:flex" />

            <div className="flex flex-1 overflow-hidden">
              <Sidebar className="hidden md:block md:h-[calc(100vh-2rem)]" />

              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-0 pb-16 md:pb-4">
                  {children}
                </div>
              </main>
            </div>

            <MobileNavigation className="md:hidden" />
          </div>
          <FormRenderer />
          <Toaster />
        </SidebarProvider>
      </FormProvider>
    </TooltipProvider>
  </FinanceDataProvider>
);
