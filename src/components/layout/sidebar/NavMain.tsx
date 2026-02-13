import { ChevronRightIcon, type LucideIcon, SquareTerminal } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/constants/routes';

const ITEMS: {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}[] = [
  {
    title: ROUTES.DASHBOARD.label,
    url: ROUTES.DASHBOARD.path,
    icon: ROUTES.DASHBOARD.icon,
    isActive: true,
  },
  {
    title: ROUTES.DAILY_LEDGER.label,
    url: ROUTES.DAILY_LEDGER.path,
    icon: ROUTES.DAILY_LEDGER.icon,
  },
  {
    title: ROUTES.TRANSACTION_LIST.label,
    url: ROUTES.TRANSACTION_LIST.path,
    icon: ROUTES.TRANSACTION_LIST.icon,
  },
  {
    title: ROUTES.TRANSFER_LIST.label,
    url: ROUTES.TRANSFER_LIST.path,
    icon: ROUTES.TRANSFER_LIST.icon,
  },
  {
    title: ROUTES.ACCOUNT_LIST.label,
    url: ROUTES.ACCOUNT_LIST.path,
    icon: ROUTES.ACCOUNT_LIST.icon,
  },
  {
    title: ROUTES.DEBT_LIST.label,
    url: ROUTES.DEBT_LIST.path,
    icon: ROUTES.DEBT_LIST.icon,
  },
  {
    title: ROUTES.CATEGORIES_PAGE.label,
    url: ROUTES.CATEGORIES_PAGE.path,
    icon: ROUTES.CATEGORIES_PAGE.icon,
  },
  {
    title: 'Experimental',
    url: '#',
    icon: SquareTerminal,
    items: [
      {
        title: ROUTES.SANDBOX_PAGE.label,
        url: ROUTES.SANDBOX_PAGE.path,
        icon: ROUTES.SANDBOX_PAGE.icon,
      },
      {
        title: ROUTES.BUDGET_PAGE.label,
        url: ROUTES.BUDGET_PAGE.path,
        icon: ROUTES.BUDGET_PAGE.icon,
      },
    ],
  },
];

const NavMain: React.FC<Props> = () => {
  const { pathname } = useLocation();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {ITEMS.map((item) => {
          const hasSubItems = Array.isArray(item.items) && item.items.length > 0;

          return hasSubItems ? (
            <Collapsible asChild defaultOpen={pathname === item.url} className="group/collapsible" key={item.title}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span className="flex-1 text-left">
                      <span>{item.title}</span>
                    </span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavMain;
