import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { FormRenderer } from '@/components/common/FormRenderer';
import Header from '@/components/layout/Header';
import MobileNavigation from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceDataProvider } from '@/contexts/FinanceData';
import { FormProvider, FormType, useForm as useFormContext } from '@/contexts/Form';
import { SidebarProvider } from '@/contexts/sidebar';
import { HotkeysProvider } from '@/components/common/HotkeysDialog';

const HotkeyHandler: React.FC = () => {
  const { openForm } = useFormContext();

  useHotkeys(['shift+t'], (event) => {
    event.preventDefault();
    openForm(FormType.Transaction);
  }, [openForm]);

  useHotkeys(['shift+r'], (event) => {
    event.preventDefault();
    openForm(FormType.Transfer);
  }, [openForm]);

  return null;
};

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
                  <HotkeyHandler />
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
