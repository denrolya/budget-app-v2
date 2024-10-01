import React, { useEffect, useState } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ResponsiveTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  desktopComponent?: 'tooltip' | 'hovercard';
  contentClassName?: string;
  triggerClassName?: string;
  openDelay?: number;
  closeDelay?: number;
}

export const ResponsiveTooltip = ({
                                            content,
                                            children,
                                            desktopComponent = 'tooltip',
                                            contentClassName,
                                            triggerClassName,
                                            openDelay = 0,
                                            closeDelay = 0,
                                          }: ResponsiveTooltipProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust this breakpoint as needed
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild className={cn(triggerClassName)}>
          {children}
        </PopoverTrigger>
        <PopoverContent className={cn('w-auto', contentClassName)}>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  if (desktopComponent === 'hovercard') {
    return (
      <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
        <HoverCardTrigger asChild className={cn(triggerClassName)}>
          <span>
            {children}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className={cn(contentClassName)}>
          {content}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <TooltipProvider delayDuration={openDelay}>
      <Tooltip>
        <TooltipTrigger asChild className={cn(triggerClassName)}>
          <span>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className={cn(contentClassName)} sideOffset={5}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
