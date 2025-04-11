import { LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const LayoutV4 = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="h-10 bg-primary text-primary-foreground flex items-center px-4 justify-between">
        <nav className="flex items-center space-x-4">
          <Link to="/" className="font-semibold">
            Home
          </Link>
          <Link to="/about" className="font-semibold">
            About
          </Link>
          <Link to="/contact" className="font-semibold">
            Contact
          </Link>
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-secondary text-secondary-foreground transition-all duration-300 ease-in-out ${
            isSidebarHovered ? 'translate-x-0' : '-translate-x-56'
          } fixed left-0 top-10 bottom-0 z-10`}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="block py-2 px-4 rounded hover:bg-primary hover:text-primary-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/projects" className="block py-2 px-4 rounded hover:bg-primary hover:text-primary-foreground">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/tasks" className="block py-2 px-4 rounded hover:bg-primary hover:text-primary-foreground">
                  Tasks
                </Link>
              </li>
              <li>
                <Link to="/reports" className="block py-2 px-4 rounded hover:bg-primary hover:text-primary-foreground">
                  Reports
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 ml-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
