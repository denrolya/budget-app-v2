import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { FormRenderer } from '@/components/common/FormRenderer';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceDataProvider } from '@/contexts/FinanceData';
import { FormProvider, FormType, useForm as useFormContext } from '@/contexts/Form';
import { SidebarProvider } from '@/contexts/sidebar';

const HotkeyHandler: React.FC = () => {
  const { openForm } = useFormContext();

  useHotkeys(['ctrl+t'], (event) => {
    event.preventDefault();
    openForm(FormType.Transaction);
  }, [openForm]);

  useHotkeys(['ctrl+r'], (event) => {
    event.preventDefault();
    openForm(FormType.Transfer);
  }, [openForm]);

  return null;
};

export const LayoutV9: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FinanceDataProvider>
    <TooltipProvider>
      <FormProvider>
        <SidebarProvider>
          <div className="flex flex-col bg-background min-h-screen md:h-screen md:overflow-hidden">
            <Header className="hidden md:flex" />

            <div className="flex flex-1 overflow-hidden">
              <Sidebar className="hidden md:block md:h-[calc(100vh-2rem)]" />

              <main className="flex flex-1 overflow-y-auto pb-16 md:pb-4">
                {children}
              </main>
            </div>

            <MobileNavigation className="md:hidden" />
          </div>

          <HotkeyHandler />
          <FormRenderer />
          <Toaster />
        </SidebarProvider>
      </FormProvider>
    </TooltipProvider>
  </FinanceDataProvider>
);
