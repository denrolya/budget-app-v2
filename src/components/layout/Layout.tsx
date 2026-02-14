import React from 'react';

import { FormRenderer } from '@/components/common/FormRenderer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrencyConverterProvider } from '@/contexts/CurrencyConverter';
import { FormProvider } from '@/contexts/Form';
import { HotkeysProvider } from '@/contexts/Hotkeys';

import Header from './header/Header';
import MobileNavigation from './MobileNavigation';
import AppSidebar from './sidebar/AppSidebar';

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <TooltipProvider>
    <FormProvider>
      <SidebarProvider defaultOpen={false} className="overflow-hidden">
        <CurrencyConverterProvider>
          <HotkeysProvider>
            <AppSidebar />

            <SidebarInset>
              <div className="flex flex-col h-screen">
                <Header className="hidden md:flex" />

                <main className="flex flex-col h-full md:overflow-hidden bg-background">
                  {children}
                </main>

                <MobileNavigation />
                <FormRenderer />
              </div>
            </SidebarInset>
          </HotkeysProvider>
        </CurrencyConverterProvider>
      </SidebarProvider>
    </FormProvider>
  </TooltipProvider>
);

export default Layout;
