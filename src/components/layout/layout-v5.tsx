import cn from 'classnames';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Home,
  ListMusic,
  LogOut,
  Mic2,
  Moon,
  Music,
  Music2,
  PlayCircle,
  Plus,
  Radio,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const LayoutV5 = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-accent/10 backdrop-blur-xl border-b border-accent/20 h-10 flex items-center px-4 justify-between">
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="w-6 h-6">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-6 h-6">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Retractable Sidebar */}
        <div
          className={cn(
            'bg-accent/5 border-r border-accent/20 flex flex-col transition-all duration-300 ease-in-out',
            isSidebarExpanded ? 'w-64' : 'w-16',
          )}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Listen Now</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Music2 className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Browse</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Radio className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Radio</span>}
                </Button>
              </div>

              <div className="space-y-1">
                {isSidebarExpanded && (
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Library</div>
                )}
                <Button variant="ghost" className="w-full justify-start">
                  <PlayCircle className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Playlists</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Music className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Songs</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ListMusic className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Albums</span>}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Mic2 className="h-4 w-4" />
                  {isSidebarExpanded && <span className="ml-2">Artists</span>}
                </Button>
              </div>

              {isSidebarExpanded && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-accent-foreground/60 px-2 py-1">Playlists</div>
                  <ScrollArea className="h-[200px] w-full">
                    {[...Array(20)].map((_, i) => (
                      <Button key={i} variant="ghost" className="w-full justify-start font-normal">
                        <ListMusic className="mr-2 h-4 w-4" />
                        My Playlist {i + 1}
                      </Button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-accent/20">
            <Button variant="ghost" className="w-full justify-start">
              <Plus className="h-4 w-4" />
              {isSidebarExpanded && <span className="ml-2">New Playlist</span>}
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background p-8">
          <h1 className="text-3xl font-bold mb-4 text-accent-foreground">Listen Now</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-xl overflow-hidden bg-accent/10">
                  <img
                    src={`/placeholder.svg?height=150&width=150&text=Album+${i + 1}`}
                    alt={`Album ${i + 1}`}
                    className="object-cover w-full h-full"
                    width={150}
                    height={150}
                  />
                </div>
                <div className="space-y-1 text-sm">
                  <h3 className="font-medium leading-none text-accent-foreground">Album {i + 1}</h3>
                  <p className="text-xs text-accent-foreground/60">Artist {i + 1}</p>
                </div>
              </div>
            ))}
          </div>
          <Outlet />
        </main>
      </div>

      {/* Bottom player */}
      <div className="h-20 bg-accent/5 border-t border-accent/20 flex items-center px-4">
        <div className="flex items-center flex-1">
          <img
            src="/placeholder.svg?height=48&width=48&text=Cover"
            alt="Album cover"
            className="w-12 h-12 rounded-md mr-4"
            width={48}
            height={48}
          />
          <div>
            <h3 className="font-medium text-accent-foreground">Song Title</h3>
            <p className="text-sm text-accent-foreground/60">Artist Name</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button size="icon" variant="ghost">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <PlayCircle className="h-6 w-6" />
          </Button>
          <Button size="icon" variant="ghost">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
