import { Copy, ExternalLink, ListTree } from 'lucide-react';
import React, { useCallback } from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

import type { Item } from './types';

type Props = {
  item: Item;
  children: React.ReactNode;
  onSelect?: (id: string) => void;
  onViewTransactions?: (id: string) => void;
};

export const DistributionListRowMenu: React.FC<Props> = ({
                                                           item,
                                                           children,
                                                           onSelect,
                                                           onViewTransactions,
                                                         }) => {
  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
    }
  }, []);

  const id = String(item.id);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="truncate text-sm font-medium">
          {item.name}
        </ContextMenuLabel>

        <ContextMenuSeparator />

        {onSelect && (
          <ContextMenuItem onSelect={() => onSelect(id)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </ContextMenuItem>
        )}

        {onViewTransactions && (
          <ContextMenuItem onSelect={() => onViewTransactions(id)}>
            <ListTree className="mr-2 h-4 w-4" />
            View transactions
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={() => copy(id)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy id
        </ContextMenuItem>

        <ContextMenuItem onSelect={() => copy(item.name)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy name
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default DistributionListRowMenu;
