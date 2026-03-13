import { RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const PWAWrapper = ({ children }: { children: React.ReactNode }) => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.MODE !== 'production') return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // intentionally silent
      });
  }, []);

  const applyUpdate = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setUpdateReady(false);
    window.location.reload();
  };

  const showBanner = updateReady && !dismissed;

  return (
    <>
      {children}

      {showBanner && (
        <div
          role="status"
          className="fixed bottom-16 left-3 right-3 z-50 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 shadow-lg font-mono text-xs md:left-auto md:right-4 md:w-72 md:bottom-4 animate-in slide-in-from-bottom-2 duration-200"
        >
          <span className="text-2xs uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
            update
          </span>
          <span className="flex-1 text-foreground">New version ready</span>
          <button
            aria-label="Apply update and reload"
            type="button"
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors shrink-0"
            onClick={applyUpdate}
          >
            <RefreshCw className="h-3 w-3" />
            reload
          </button>
          <button
            aria-label="Dismiss"
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
};

export default PWAWrapper;
