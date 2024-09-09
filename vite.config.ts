import path from 'path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      reporter: ['text', 'json', 'html'], // Choose the output formats
      all: true, // Include all files in coverage, even if they are not tested
      include: ['src/**/*.ts', 'src/**/*.tsx'], // Include only your source files
      exclude: ['node_modules', 'dist', 'tests', 'src/setupTests.ts'], // Exclude non-source files
    },
    exclude: [...configDefaults.exclude], // Ensure any existing excludes are kept
  },
});
