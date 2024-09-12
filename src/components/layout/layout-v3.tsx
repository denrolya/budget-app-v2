import {
  BanknoteIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  PieChartIcon,
  SettingsIcon,
  WalletIcon,
} from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export const LayoutV3 = () => (
    <div className="flex min-h-screen w-full bg-background">
      <div
        data-collapsed
        className="inset-y-0 left-0 z-20 flex w-14 flex-col items-center justify-between border-r bg-background transition-all duration-300 hover:w-64 group"
      >
        <div className="fixed flex flex-col items-center gap-4 py-4">
          <Link
            to="#"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <BanknoteIcon className="h-5 w-5" />
          </Link>
          <nav className="flex flex-col items-start gap-2">
            <Link
              to="#"
              className="flex w-full h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="ml-2 hidden group-hover:inline">Dashboard</span>
            </Link>
            <Link
              to="#"
              className="flex w-full h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
            >
              <WalletIcon className="h-5 w-5" />
              <span className="ml-2 hidden group-hover:inline">Transactions</span>
            </Link>
            <Link
              to="#"
              className="flex w-full h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
            >
              <WalletIcon className="h-5 w-5" />
              <span className="ml-2 hidden group-hover:inline">Accounts</span>
            </Link>
            <Link
              to="#"
              className="flex w-full h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
            >
              <PieChartIcon className="h-5 w-5" />
              <span className="ml-2 hidden group-hover:inline">Report</span>
            </Link>
            <Link
              to="#"
              className="flex w-full h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="ml-2 hidden group-hover:inline">Settings</span>
            </Link>
          </nav>
        </div>
      </div>
      <div className="flex-1">
        <header className="sticky top-0 z-10 flex h-10 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="sm:hidden">
              <MenuIcon className="h-5 w-5" />
            </Button>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm transition-colors hover:text-foreground/80 text-foreground focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className="inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              >
                Transactions
              </Link>
              <Link
                to="#"
                className="inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              >
                Accounts
              </Link>
              <Link
                to="#"
                className="inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              >
                Reports
              </Link>
              <Link
                to="#"
                className="inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              >
                Categories
              </Link>
            </nav>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>John Doe</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <MoonIcon className="mr-2 h-4 w-4" />
                Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
