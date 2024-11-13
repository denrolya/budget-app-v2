import { createContext, useContext, useEffect, useState } from 'react';
import { useHotkeys as useReactHotkeysHook } from 'react-hotkeys-hook';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFinanceData } from '@/contexts/FinanceData';
import { FormType, useForm as useFormContext } from '@/contexts/Form';

type Hotkey = {
  windows: string
  mac: string
  description: string
}

type HotkeyCategory = {
  name: string
  hotkeys: Hotkey[]
}

const globalHotkeys: HotkeyCategory = {
  name: 'Global',
  hotkeys: [
    { windows: 'Shift+A', mac: 'Shift+A', description: 'Open Account Form' },
    { windows: 'Shift+T', mac: 'Shift+T', description: 'Open Transaction Form' },
    { windows: 'Shift+R', mac: 'Shift+R', description: 'Open Transfer Form' },
    { windows: 'Shift+C', mac: 'Shift+C', description: 'Open Currency Converter' },
    { windows: 'H', mac: 'H', description: 'Open/Close this window' },
  ],
};

type HotkeysContextType = {
  addPageHotkeys: (pageName: string, hotkeys: Hotkey[]) => void
  removePageHotkeys: (pageName: string) => void
  currentPage: string
  setCurrentPage: (pageName: string) => void
  openHotkeysDialog: () => void
  closeHotkeysDialog: () => void
}

const HotkeysContext = createContext<HotkeysContextType | null>(null);

export const HotkeysProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [, setPageHotkeys] = useState<{ [key: string]: HotkeyCategory }>({});
  const [currentPage, setCurrentPage] = useState<string>('Global');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { openForm } = useFormContext();
  const { toggleCurrencyConverter } = useFinanceData();

  const toggleHotkeysDialog = () => setIsDialogOpen(prev => !prev);
  const openHotkeysDialog = () => setIsDialogOpen(true);
  const closeHotkeysDialog = () => setIsDialogOpen(false);

  useReactHotkeysHook('shift+t', (event) => {
    event.preventDefault();
    openForm(FormType.Transaction);
  }, [openForm]);

  useReactHotkeysHook('shift+r', (event) => {
    event.preventDefault();
    openForm(FormType.Transfer);
  }, [openForm]);

  useReactHotkeysHook('shift+a', (event) => {
    event.preventDefault();
    openForm(FormType.Account);
  }, [openForm]);

  useReactHotkeysHook('shift+c', (event) => {
    event.preventDefault();
    toggleCurrencyConverter();
  }, [toggleCurrencyConverter]);

  useReactHotkeysHook('h', (event) => {
    event.preventDefault();
    toggleHotkeysDialog();
  }, []);

  const addPageHotkeys = (pageName: string, hotkeys: Hotkey[]) => {
    setPageHotkeys(prev => ({
      ...prev,
      [pageName]: { name: pageName, hotkeys },
    }));
  };

  const removePageHotkeys = (pageName: string) => {
    setPageHotkeys(prev => {
      const newPageHotkeys = { ...prev };
      delete newPageHotkeys[pageName];
      return newPageHotkeys;
    });
  };

  return (
    <HotkeysContext.Provider
      value={{
        addPageHotkeys,
        removePageHotkeys,
        currentPage,
        setCurrentPage,
        openHotkeysDialog,
        closeHotkeysDialog,
      }}>
      {children}
      <HotkeysDialog isOpen={isDialogOpen} onClose={closeHotkeysDialog} />
    </HotkeysContext.Provider>
  );
};

export const useHotkeys = () => {
  const context = useContext(HotkeysContext);
  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeysProvider');
  }
  return context;
};

type HotkeysDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export const HotkeysDialog: React.FC<HotkeysDialogProps> = ({ isOpen, onClose }) => {
  const [allCategories, setAllCategories] = useState<HotkeyCategory[]>([globalHotkeys]);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const context = useContext(HotkeysContext);
  if (!context) {
    throw new Error('HotkeysDialog must be used within a HotkeysProvider');
  }

  useEffect(() => {
    const pageHotkeys = Object.values(context)
      .filter(value => typeof value === 'object' && 'name' in value && 'hotkeys' in value) as HotkeyCategory[];
    setAllCategories([globalHotkeys, ...pageHotkeys]);
  }, [context]);

  const renderHotkeyList = (category: HotkeyCategory) => (
    <div key={category.name} className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold mb-2 text-primary dark:text-primary-foreground">{category.name}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {category.hotkeys.map((hotkey) => (
          <div key={hotkey.description} className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-28">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                {isMac ? hotkey.mac : hotkey.windows}
              </kbd>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">{hotkey.description}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="sr-only">
            A list of keyboard shortcuts available in the application
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {allCategories.map(renderHotkeyList)}
        </ScrollArea>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Shift key is the same for all platforms
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotkeysDialog;
