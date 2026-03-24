import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

let root: ReturnType<typeof createRoot> | null = null;

const HotkeyListener: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onConfirm, onCancel]);

  return null;
};

export const confirm = (options: ConfirmationOptions): Promise<boolean> =>
  new Promise((resolve) => {
    const containerElement = document.createElement('div');
    document.body.appendChild(containerElement);

    const cleanup = () => {
      if (root) {
        root.unmount();
        document.body.removeChild(containerElement);
        root = null;
      }
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    root = createRoot(containerElement);

    root.render(
      <AlertDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 px-3 text-xs" onClick={handleCancel}>
              {options.cancelText || 'No'} <kbd className="ml-1 text-[10px] text-muted-foreground opacity-70">N</kbd>
            </AlertDialogCancel>
            <AlertDialogAction className="h-8 px-3 text-xs" onClick={handleConfirm}>
              {options.confirmText || 'Yes'}{' '}
              <kbd className="ml-1 text-[10px] text-primary-foreground opacity-70">Y</kbd>
            </AlertDialogAction>
          </AlertDialogFooter>
          <HotkeyListener onCancel={handleCancel} onConfirm={handleConfirm} />
        </AlertDialogContent>
      </AlertDialog>,
    );
  });
