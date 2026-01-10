import { Bike, Check, ChevronsUpDown, Command, Laptop, LogOut, Moon, Palmtree, Sun } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useHotkeys } from '@/contexts/Hotkeys';
import { Theme, useTheme } from '@/contexts/theme';
import { useAuth } from '@/features/auth';

const NavUser: React.FC = () => {
  const { isMobile } = useSidebar();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { openHotkeysDialog } = useHotkeys();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage alt={user.username} src={user.username} />
                <AvatarFallback className="rounded-lg">{user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">User:</span>
                <span className="truncate text-xs">{user.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage alt={user.username} src={user.username} />
                  <AvatarFallback className="rounded-lg">{user.username[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">User:</span>
                  <span className="truncate text-xs">{user.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={openHotkeysDialog}>
                <Command className="mr-2 h-4 w-4" />
                <span>Hotkeys</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Custom</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme(Theme.TronDark)}>
                    <Bike className="mr-2 h-4 w-4" />
                    <span>Tron Dark</span>
                    {theme === Theme.TronDark && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel>Default</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme(Theme.Light)}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === Theme.Light && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(Theme.Dark)}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === Theme.Dark && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel>System</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme(Theme.System)}>
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === Theme.System && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default NavUser;
