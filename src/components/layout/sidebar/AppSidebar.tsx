import React from 'react';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';

import CurrencySwitcher from './CurrencySwitcher';
import NavAccounts from './NavAccounts';
import NavMain from './NavMain';
import NavUser from './NavUser';


const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = (props) => (
  <Sidebar collapsible="icon" {...props}>
    <SidebarHeader>
      <CurrencySwitcher />
    </SidebarHeader>
    <SidebarContent>
      <NavMain />
      <NavAccounts />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
);

export default AppSidebar;
