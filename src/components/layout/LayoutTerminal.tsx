/**
 * LayoutTerminal — TUI-inspired sidebarless layout.
 *
 * Structure:
 *   CommandBar  (h-9, top — tmux window strip)
 *   <main>      (flex-1, page content)
 *   Statusline  (h-10, bottom — vim-airline style, hidden on mobile)
 *   MobileNavigation  (mobile only)
 *
 * Revert in one line: change the Layout import in Routing.tsx back to Layout.
 */
import React from 'react';

import { FormRenderer } from '@/components/common/FormRenderer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrencyConverterProvider } from '@/contexts/CurrencyConverter';
import { FormProvider } from '@/contexts/Form';
import { HotkeysProvider } from '@/contexts/Hotkeys';

import CommandBar from './header/CommandBar';
import { PageHeaderProvider } from './header/PageHeaderContext';
import Statusline from './statusline/Statusline';

const LayoutTerminal: React.FC<React.PropsWithChildren> = ({ children }) => (
  <TooltipProvider>
    <FormProvider>
      <CurrencyConverterProvider>
        <HotkeysProvider>
          <PageHeaderProvider>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
              {/* Top command bar — tmux window tabs */}
              <CommandBar />

              {/* Page content */}
              <main className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
                {children}
              </main>

              {/* Bottom statusline */}
              <Statusline />

              {/* Form modals */}
              <FormRenderer />
            </div>
          </PageHeaderProvider>
        </HotkeysProvider>
      </CurrencyConverterProvider>
    </FormProvider>
  </TooltipProvider>
);

export default LayoutTerminal;
