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

export const confirm = (options: ConfirmationOptions): Promise<boolean> => new Promise((resolve) => {
  const containerElement = document.createElement('div');
  document.body.appendChild(containerElement);

  const cleanup = () => {
    if (root) {
      root.unmount();
      document.body.removeChild(containerElement);
      root = null;
    }
  };

  root = createRoot(containerElement);

  root.render(
    <AlertDialog open={true} onOpenChange={(open) => {
      if (!open) {
        cleanup();
        resolve(false);
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>{options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            cleanup();
            resolve(false);
          }}>
            {options.cancelText || 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            cleanup();
            resolve(true);
          }}>
            {options.confirmText || 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
});
