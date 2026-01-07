import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { PluginOption } from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
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
    name: 'Budget V2',
    short_name: 'Budget',
    description: 'Your personal budget management app',
    theme_color: '#000000',
    background_color: '#ffffff',
    icons: [
      {
        src: '/android-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
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
        src: '/apple-icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/apple-icon-120x120.png',
        sizes: '120x120',
        type: 'image/png',
      },
      {
        src: '/apple-icon-114x114.png',
        sizes: '114x114',
        type: 'image/png',
      },
      {
        src: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/apple-icon-76x76.png',
        sizes: '76x76',
        type: 'image/png',
      },
      {
        src: '/apple-icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/apple-icon-60x60.png',
        sizes: '60x60',
        type: 'image/png',
      },
      {
        src: '/apple-icon-57x57.png',
        sizes: '57x57',
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
      {
        src: '/ms-icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
  },
};

export default defineConfig({
  build: {
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('@tanstack')) return 'vendor-tanstack';

          // heavy charting + d3 ecosystem
          if (id.includes('recharts') || id.includes('@nivo') || id.includes('d3-')) return 'vendor-charts';

          // date libs
          if (id.includes('moment') || id.includes('date-fns')) return 'vendor-dates';

          // utilities
          if (id.includes('lodash')) return 'vendor-utils';

          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    visualizer({ open: true }) as unknown as PluginOption, // This will open a visualization of your chunks after build
    VitePWA(pwaOptions),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
