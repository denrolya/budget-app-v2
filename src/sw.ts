/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Extend the ServiceWorkerGlobalScope interface to include __WB_MANIFEST
declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{
      revision: string | null
      url: string
    }>
  }
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

precacheAndRoute(self.__WB_MANIFEST);
