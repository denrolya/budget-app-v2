import React from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type HotkeyCategory } from '@/types/hotkeys';
import { useHotkeys } from '@/contexts/Hotkeys';

type HotkeysDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const KeyboardKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center justify-center min-w-[2em] h-8 px-2 text-xs font-semibold text-secondary-foreground bg-secondary rounded-md border border-secondary-foreground/20 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2),0_1px_2px_0_rgba(0,0,0,0.1)] transition-all duration-100 ease-in-out hover:translate-y-[1px] hover:shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.2),0_1px_1px_0_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-none mx-0.5">
    {children}
  </span>
);

export const HotkeysDialog: React.FC<HotkeysDialogProps> = ({ isOpen, onClose }) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const { pageHotkeys } = useHotkeys();

  const renderHotkeyTrigger = (trigger: string) =>
    trigger.split('+').map((key, index) => (
      <React.Fragment key={index}>
        <KeyboardKey>{key.trim()}</KeyboardKey>
        {index < trigger.split('+').length - 1 && <span className="mx-0.5">+</span>}
      </React.Fragment>
    ));

  const renderHotkeyList = (category: HotkeyCategory) => (
    <div className="mb-6 last:mb-0" key={category.name}>
      <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {category.hotkeys.map((hotkey) => (
          <div className="flex items-center space-x-4" key={hotkey.description}>
            <div className="flex-shrink-0 min-w-[120px]">
              {renderHotkeyTrigger(isMac ? hotkey.mac : hotkey.windows)}
            </div>
            <span className="text-sm text-muted-foreground">{hotkey.description}</span>
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
        <ScrollArea className="h-[60vh] pr-4">{Object.values(pageHotkeys).map(renderHotkeyList)}</ScrollArea>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Shift key is the same for all platforms
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotkeysDialog;
