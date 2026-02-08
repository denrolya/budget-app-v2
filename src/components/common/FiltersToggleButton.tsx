import { Filter } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  activeCount?: number;
}

const FiltersToggleButton: React.FC<Props> = ({ activeCount = 0, className, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" variant="outline" className={cn('relative', className)} onClick={onClick}>
        <Filter className="h-4 w-4" />
        <span className="sr-only">Filters</span>
        <Badge className="absolute -top-2 -right-2 px-1 py-0.5 text-[0.6rem] min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full">
          {activeCount}
        </Badge>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Filters</TooltipContent>
  </Tooltip>
);

export default FiltersToggleButton;
