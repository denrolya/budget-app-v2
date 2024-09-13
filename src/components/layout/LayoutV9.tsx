import { Outlet } from 'react-router-dom';

import { FormRenderer } from '@/components/common/FormRenderer';
import { CurrencyConverter } from '@/components/features/CurrencyConverter';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceDataProvider } from '@/contexts/FinanceData.tsx';
import { FormProvider } from '@/contexts/form';
import { SidebarProvider } from '@/contexts/sidebar';

export const LayoutV9 = ({ children }) => (
  <FinanceDataProvider>
    <TooltipProvider>
      <FormProvider>
        <SidebarProvider>
          <div className="h-screen bg-background flex flex-col">
            <Header />

            <div className="flex flex-1 overflow-hidden">
              <Sidebar />

              <main className="flex-1 overflow-auto bg-background">
                {children}
              </main>
            </div>

            <CurrencyConverter />
          </div>

          <FormRenderer />
          <Toaster />
        </SidebarProvider>
      </FormProvider>
    </TooltipProvider>
  </FinanceDataProvider>
);
