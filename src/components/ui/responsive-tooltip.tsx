import React from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

interface WrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Wrapper = React.forwardRef<HTMLDivElement, WrapperProps>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
));
Wrapper.displayName = 'Wrapper';

interface Props {
  content: React.ReactNode;
  children: React.ReactNode;
  desktopComponent?: 'tooltip' | 'hovercard';
  contentClassName?: string;
  triggerClassName?: string;
  openDelay?: number;
  closeDelay?: number;
}

export const ResponsiveTooltip: React.FC<Props> = ({
  content,
  children,
  desktopComponent = 'tooltip',
  contentClassName,
  triggerClassName,
  openDelay = 0,
  closeDelay = 0,
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Wrapper className={triggerClassName}>{children}</Wrapper>
        </PopoverTrigger>
        <PopoverContent className={cn('w-auto', contentClassName)}>{content}</PopoverContent>
      </Popover>
    );
  }

  if (desktopComponent === 'hovercard') {
    return (
      <HoverCard openDelay={openDelay} closeDelay={closeDelay} className={cn(contentClassName)}>
        <HoverCardTrigger asChild>
          <Wrapper className={triggerClassName}>{children}</Wrapper>
        </HoverCardTrigger>
        <HoverCardContent>{content}</HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <TooltipProvider delayDuration={openDelay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper className={triggerClassName}>{children}</Wrapper>
        </TooltipTrigger>
        <TooltipContent className={cn(contentClassName)} sideOffset={5}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ResponsiveTooltip;
