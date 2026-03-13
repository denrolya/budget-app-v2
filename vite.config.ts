import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { type PluginOption } from 'vite';
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';
import { configDefaults, defineConfig } from 'vitest/config';

const pwaOptions: Partial<VitePWAOptions> = {
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'autoUpdate',
  injectManifest: {
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Set to 5 MB or your desired size
  },
  includeAssets: [
    'favicon.ico',
    'apple-icon-180x180.png',
    'apple-icon-152x152.png',
    'apple-icon-144x144.png',
    'apple-icon-120x120.png',
    'apple-icon-114x114.png',
    'apple-icon-76x76.png',
    'apple-icon-72x72.png',
    'apple-icon-60x60.png',
    'apple-icon-57x57.png',
    'android-icon-192x192.png',
    'favicon-96x96.png',
    'favicon-32x32.png',
    'favicon-16x16.png',
    'ms-icon-144x144.png',
    'mask-icon.svg',
  ],
  manifest: {
    name: 'Budget',
    short_name: 'Budget',
    description: 'Personal budget — balances, ledger, rates',
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen'],
    orientation: 'portrait',
    start_url: '/m',
    scope: '/',
    icons: [
      {
        src: '/android-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/apple-icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Balances',
        short_name: 'Balances',
        url: '/m/balances',
        icons: [{ src: '/android-icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Ledger',
        short_name: 'Ledger',
        url: '/m/ledger',
        icons: [{ src: '/android-icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Rates',
        short_name: 'Rates',
        url: '/m/rates',
        icons: [{ src: '/android-icon-96x96.png', sizes: '96x96' }],
      },
    ],
  },
};

export default defineConfig({
  build: {
    sourcemap: false,
    minify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // leaf-heavy chunks
          if (id.includes('/recharts/') || id.includes('/@nivo/') || id.includes('/d3-')) {
            return 'vendor-charts';
          }

          if (id.includes('/@tanstack/')) return 'vendor-tanstack';

          // everything else (React, Radix, Sonner, UI libs, utilities, dates, etc.)
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    visualizer({ open: false }) as unknown as PluginOption, // This will open a visualization of your chunks after build
    VitePWA(pwaOptions),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.tsx',
    coverage: {
      reporter: ['text', 'json', 'html'], // Coverage output formats
      all: true, // Include all files in coverage, even if not tested
      include: ['src/**/*.ts', 'src/**/*.tsx'], // Only include source files
      exclude: ['node_modules', 'dist', '__tests__', 'src/setupTests.ts'], // Exclude tests and setup
    },
    include: [
      '__tests__/**/*.spec.ts',
      '__tests__/**/*.spec.tsx',
      '**/__tests__/**/*.spec.ts',
      '**/__tests__/**/*.spec.tsx',
    ],
    exclude: [...configDefaults.exclude], // Use default excludes from Vitest
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // or "modern"
      },
    },
  },
});
