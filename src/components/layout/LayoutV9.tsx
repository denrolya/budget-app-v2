import { BarChart2, Book, CreditCard, DollarSign, Folder, Home, Menu } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';

import { FormRenderer } from '@/components/common/FormRenderer';
import { CurrencyConverter } from '@/components/features/CurrencyConverter';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceDataProvider } from '@/contexts/FinanceData.tsx';
import { FormProvider } from '@/contexts/form';
import { SidebarProvider } from '@/contexts/sidebar';

const MobileNavigation: React.FC<{className: string}> = ({ className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('fixed bottom-0 left-0 z-50 w-full bg-background border-t border-border', className)}>
      <div className="grid h-14 grid-cols-5 font-medium">
        <Link to="/" className="flex flex-col items-center justify-center h-full text-foreground hover:bg-muted">
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link to="/transactions"
              className="flex flex-col items-center justify-center h-full text-foreground hover:bg-muted">
          <DollarSign className="w-6 h-6" />
          <span className="text-xs mt-1">Transactions</span>
        </Link>
        <Link to="/ledger" className="flex flex-col items-center justify-center h-full text-foreground hover:bg-muted">
          <Book className="w-6 h-6" />
          <span className="text-xs mt-1">Ledger</span>
        </Link>
        <Link to="/accounts"
              className="flex flex-col items-center justify-center h-full text-foreground hover:bg-muted">
          <CreditCard className="w-6 h-6" />
          <span className="text-xs mt-1">Accounts</span>
        </Link>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" className="flex flex-col items-center justify-center h-full rounded-none">
              <Menu className="w-6 h-6" />
              <span className="text-xs mt-1">More</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Access additional features and pages</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <nav className="space-y-2">
                <Link to="/" className="flex items-center p-2 rounded-lg hover:bg-muted" onClick={() => setOpen(false)}>
                  <Home className="w-5 h-5 mr-3" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/transactions"
                      className="flex items-center p-2 rounded-lg hover:bg-muted"
                      onClick={() => setOpen(false)}>
                  <DollarSign className="w-5 h-5 mr-3" />
                  <span>Transactions</span>
                </Link>
                <Link to="/ledger"
                      className="flex items-center p-2 rounded-lg hover:bg-muted"
                      onClick={() => setOpen(false)}>
                  <Book className="w-5 h-5 mr-3" />
                  <span>Ledger</span>
                </Link>
                <Link to="/accounts"
                      className="flex items-center p-2 rounded-lg hover:bg-muted"
                      onClick={() => setOpen(false)}>
                  <CreditCard className="w-5 h-5 mr-3" />
                  <span>Accounts</span>
                </Link>
                <Link to="/reports"
                      className="flex items-center p-2 rounded-lg hover:bg-muted"
                      onClick={() => setOpen(false)}>
                  <BarChart2 className="w-5 h-5 mr-3" />
                  <span>Reports</span>
                </Link>
                <Link to="/categories"
                      className="flex items-center p-2 rounded-lg hover:bg-muted"
                      onClick={() => setOpen(false)}>
                  <Folder className="w-5 h-5 mr-3" />
                  <span>Categories</span>
                </Link>
              </nav>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export const LayoutV9: React.FC<{ children: React.ReactNode }>= ({ children }) => (
    <FinanceDataProvider>
      <TooltipProvider>
        <FormProvider>
          <SidebarProvider>
            <div className="flex flex-col bg-background min-h-screen md:h-screen md:overflow-hidden">
              <Header />

              <div className="flex flex-1 overflow-hidden">
                <Sidebar className="hidden md:block md:h-[calc(100vh-2rem)]" />

                <main className="flex-1 overflow-y-auto">
                  <div className="container mx-auto p-4 pb-16 md:pb-4">
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
