/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Use the correct event listener for service workers
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

cleanupOutdatedCaches();

// Precache and route assets
precacheAndRoute(self.__WB_MANIFEST);

// This allows the web app to trigger skipWaiting via registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

// Claim any clients immediately
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    clientsClaim(),
  );
});
