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
          <div className="flex flex-col h-screen overflow-hidden bg-background">
            <Header />

            <div className="flex flex-1 overflow-hidden">
              <Sidebar />

              <main className="flex-1 overflow-y-auto bg-background">
                <div className="container mx-auto p-4">
                  {children}
                </div>
              </main>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
              <CurrencyConverter />
            </div>
          </div>

          <FormRenderer />
          <Toaster />
        </SidebarProvider>
      </FormProvider>
    </TooltipProvider>
  </FinanceDataProvider>
);
