import { Link, Outlet } from 'react-router-dom';

import {
  HomeIcon,
  LayoutGridIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  MountainIcon,
  PowerIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from '@/components/ui/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const LayoutV2 = () => (
  <div className="flex min-h-screen w-full">
    <div className="hidden lg:block bg-background border-r h-full w-64">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link to="#" className="flex items-center gap-2">
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-2 px-4 py-6 lg:px-6">
        <Link
          to="#"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <HomeIcon className="h-5 w-5" />
          Home
        </Link>
        <Link
          to="#"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <LayoutGridIcon className="h-5 w-5" />
          Dashboard
        </Link>
        <Link
          to="#"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <UsersIcon className="h-5 w-5" />
          Users
        </Link>
        <Link
          to="#"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <SettingsIcon className="h-5 w-5" />
          Settings
        </Link>
      </nav>
    </div>
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 lg:hidden">
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-background border-r h-full w-64 lg:hidden">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <Link to="#" className="flex items-center gap-2">
            <MountainIcon className="h-6 w-6" />
            <span className="sr-only">Acme Inc</span>
          </Link>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <XIcon className="h-6 w-6" />
              <span className="sr-only">Close Sidebar</span>
            </Button>
          </SheetClose>
        </div>
        <nav className="flex flex-col gap-2 px-4 py-6 lg:px-6">
          <Link
            to="#"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </Link>
          <Link
            to="#"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutGridIcon className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="#"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            <UsersIcon className="h-5 w-5" />
            Users
          </Link>
          <Link
            to="#"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 flex h-10 w-full items-center justify-between border-b bg-background px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
          </Sheet>
          <Link to="#" className="flex items-center gap-2">
            <MountainIcon className="h-6 w-6" />
            <span className="sr-only">Acme Inc</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoonIcon className="h-6 w-6" />
                <span className="sr-only">Toggle Dark Mode</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                <MoonIcon className="h-4 w-4 mr-2" />
                Dark Mode
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                <SunIcon className="h-4 w-4 mr-2" />
                Light Mode
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <SettingsIcon className="h-6 w-6" />
                <span className="sr-only">Preferences</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Preferences</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PowerIcon className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-6 h-6 border">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <span className="sr-only">User Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Signed in as Acme Inc</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 bg-muted/40 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  </div>
);
