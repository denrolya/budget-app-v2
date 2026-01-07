import React, { useEffect, useState } from 'react';

const PWAWrapper = ({ children }: { children: React.ReactNode }) => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (import.meta.env.MODE !== 'production') return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setNewVersionAvailable(true);
            }
          });
        });
      })
      .catch((error: Error) => {
        console.error('Service Worker registration failed:', error);
      });
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setNewVersionAvailable(false);
    window.location.reload();
  };

  return (
    <>
      {children}
      {newVersionAvailable && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-md shadow-lg">
          <p>New version available!</p>
          <button className="mt-2 bg-secondary text-secondary-foreground px-4 py-2 rounded" onClick={reloadPage}>
            Update and Reload
          </button>
        </div>
      )}
    </>
  );
};

export default PWAWrapper;
