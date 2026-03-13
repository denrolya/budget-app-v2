/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

// @ts-expect-error expects return value
self.addEventListener('activate', (event: ExtendableEvent) => event.waitUntil(clientsClaim()));

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

// ─── Precaching ────────────────────────────────────────────────────────────────

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ─── Runtime caching ───────────────────────────────────────────────────────────

// API calls — network-first, 5s timeout, falls back to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 5,
  }),
);

// Static assets (fonts, icons) — stale-while-revalidate
registerRoute(
  ({ request }) => request.destination === 'font' || request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'assets-cache-v1' }),
);
