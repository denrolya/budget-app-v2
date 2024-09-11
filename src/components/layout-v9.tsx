import { Outlet } from 'react-router-dom';

import { CurrencyConverter } from '@/components/currency-converter';
import { FormRenderer } from '@/components/form-renderer';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';
import { FormProvider } from '@/contexts/form.tsx';
import { SidebarProvider } from '@/contexts/sidebar.tsx';

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
