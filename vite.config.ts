import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import { configDefaults, defineConfig } from 'vitest/config';

const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Finance App',
    short_name: 'FinApp',
    description: 'Your personal finance manager',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
};

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }), // This will open a visualization of your chunks after build
    VitePWA(), // pwaOptions was mentioned but not defined in your snippet
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
    include: ['__tests__/**/*.spec.ts', '__tests__/**/*.spec.tsx'], // Include only test files
    exclude: [...configDefaults.exclude], // Use default excludes from Vitest
  },
});
