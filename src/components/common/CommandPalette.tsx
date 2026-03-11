import {
  ArrowLeftRight,
  CalendarDays,
  DollarSign,
  FolderTree,
  Handshake,
  Keyboard,
  Layers,
  PiggyBank,
  Plus,
  UserPlus,
  Wallet,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { ROUTES } from '@/constants/routes';
import { useCurrencyConverter } from '@/contexts/CurrencyConverter';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys } from '@/contexts/Hotkeys';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandDef = {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
};

// Fire a keyboard event to execute a page hotkey after the palette closes
const fireHotkey = (keyStr: string) => {
  const key = /^[A-Z]$/.test(keyStr) ? keyStr.toLowerCase() : keyStr;
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { openForm } = useFormContext();
  const { pageHotkeys } = useHotkeys();
  const { open: openCurrencyConverter } = useCurrencyConverter();
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (action: () => void) => {
    onClose();
    // Defer action so dialog closes first
    setTimeout(action, 50);
  };

  const navigateCommands: CommandDef[] = [
    {
      id: 'nav-ledger',
      label: 'Open Ledger',
      icon: CalendarDays,
      shortcut: 'L',
      action: () => navigate(ROUTES.LEDGER.path),
    },
    {
      id: 'nav-accounts',
      label: 'Open Accounts',
      icon: Wallet,
      shortcut: undefined,
      action: () => navigate(ROUTES.ACCOUNT_LIST.path),
    },
    {
      id: 'nav-budget',
      label: 'Open Budget',
      icon: PiggyBank,
      shortcut: undefined,
      action: () => navigate(ROUTES.BUDGET_PAGE.path),
    },
    {
      id: 'nav-debts',
      label: 'Open Debts',
      icon: Handshake,
      shortcut: undefined,
      action: () => navigate(ROUTES.DEBT_LIST.path),
    },
    {
      id: 'nav-categories',
      label: 'Open Categories',
      icon: FolderTree,
      shortcut: undefined,
      action: () => navigate(ROUTES.CATEGORIES_PAGE.path),
    },
    {
      id: 'nav-buckets',
      label: 'Open Buckets',
      icon: Layers,
      shortcut: undefined,
      action: () => navigate(ROUTES.BUCKETS_PAGE.path),
    },
  ];

  const createCommands: CommandDef[] = [
    {
      id: 'open-currency-converter',
      label: 'Currency Converter',
      icon: DollarSign,
      shortcut: '⇧C',
      action: () => openCurrencyConverter(),
    },
    {
      id: 'create-transaction',
      label: 'New Transaction',
      icon: Plus,
      shortcut: '⇧T',
      action: () => openForm(FormType.Transaction),
    },
    {
      id: 'create-transfer',
      label: 'New Transfer',
      icon: ArrowLeftRight,
      shortcut: '⇧R',
      action: () => openForm(FormType.Transfer),
    },
    {
      id: 'create-account',
      label: 'New Account',
      icon: Wallet,
      shortcut: '⇧A',
      action: () => openForm(FormType.Account),
    },
    {
      id: 'create-category',
      label: 'New Category',
      icon: FolderTree,
      shortcut: '⇧O',
      action: () => openForm(FormType.Category),
    },
    {
      id: 'create-debt',
      label: 'New Debt',
      icon: Handshake,
      shortcut: '⇧D',
      action: () => openForm(FormType.Debt),
    },
    {
      id: 'create-bulk',
      label: 'Bulk Create Transactions',
      icon: UserPlus,
      shortcut: '⇧B',
      action: () => openForm(FormType.BulkTransaction),
    },
  ];

  // Page-specific shortcut categories (exclude always-present Global / Navigation)
  const pageSpecificCategories = Object.values(pageHotkeys).filter(
    (cat) => cat.name !== 'Global' && cat.name !== 'Navigation',
  );

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <CommandInput placeholder="Type a command or search…" ref={inputRef} />
      <CommandList>
        <CommandEmpty>
          <span className="flex items-center justify-center gap-2 text-muted-foreground py-2">
            <Keyboard className="h-4 w-4" />
            No commands found
          </span>
        </CommandEmpty>

        <CommandGroup heading="Navigate">
          {navigateCommands.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => run(cmd.action)}>
              <cmd.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {cmd.label}
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create">
          {createCommands.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => run(cmd.action)}>
              <cmd.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {cmd.label}
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        {pageSpecificCategories.map((category) => (
          <React.Fragment key={category.name}>
            <CommandSeparator />
            <CommandGroup heading={`${category.name} Shortcuts`}>
              {category.hotkeys.map((hotkey) => (
                <CommandItem
                  key={hotkey.description}
                  onSelect={() => {
                    onClose();
                    setTimeout(() => fireHotkey(hotkey.windows), 100);
                  }}
                >
                  <Keyboard className="mr-2 h-4 w-4 text-muted-foreground" />
                  {hotkey.description}
                  <CommandShortcut>{hotkey.windows}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
