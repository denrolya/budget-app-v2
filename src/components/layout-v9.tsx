import { Outlet } from 'react-router-dom';

import { CurrencyConverter } from '@/components/currency-converter';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { SidebarProvider } from '@/contexts/sidebar.tsx';

export const LayoutV9 = () => (
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
  </SidebarProvider>
);
