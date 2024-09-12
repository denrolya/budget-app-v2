import { Outlet } from 'react-router-dom';

import { CurrencyConverter } from '@/components/features/CurrencyConverter';
import { FormRenderer } from '@/components/common/FormRenderer';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FormProvider } from '@/contexts/form';
import { SidebarProvider } from '@/contexts/sidebar';

export const LayoutV9 = () => (
  <TooltipProvider>
    <FormProvider>
      <SidebarProvider>
        <div className="h-screen bg-background flex flex-col">
          <Header />

          <div className="flex flex-1 overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto bg-background">
              <Outlet />
            </main>
          </div>

          <CurrencyConverter />
        </div>

        <FormRenderer />
        <Toaster />
      </SidebarProvider>
    </FormProvider>
  </TooltipProvider>
);
