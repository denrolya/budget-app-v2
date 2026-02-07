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
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore (clipboard may be blocked)
    }
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="truncate">{item.name}</ContextMenuLabel>
        <ContextMenuSeparator />

        <ContextMenuItem onSelect={() => onSelect?.(String(item.id))}>
          Open
        </ContextMenuItem>

        {onViewTransactions ? (
          <ContextMenuItem onSelect={() => onViewTransactions(String(item.id))}>
            View transactions
          </ContextMenuItem>
        ) : null}

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={() => copy(String(item.id))}>
          Copy id
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => copy(item.name)}>
          Copy name
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default DistributionListRowMenu;
