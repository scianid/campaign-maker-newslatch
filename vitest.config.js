import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/index.js',
        '**/main.jsx',
        'vite.config.js',
        'vitest.config.js',
        'eslint.config.js',
        'postcss.config.js',
        'tailwind.config.js',
      ],
      include: ['src/**/*.{js,jsx}'],
      all: true,
      lines: 75,
      functions: 75,
      branches: 75,
      statements: 75,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
