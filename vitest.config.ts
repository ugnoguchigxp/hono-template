import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [['apps/web/**/*.{test,spec}.{ts,tsx,js,jsx}', 'jsdom']],
    include: ['packages/**/*.{test,spec}.{ts,tsx,js,jsx}', 'apps/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    alias: [
      {
        find: /^@(foundation|adapters|domains)\/([^/]+)\/(.*)\.js$/,
        replacement: path.join(__dirname, 'packages/$1/$2/src/$3'),
      },
      {
        find: /^@(foundation|adapters|domains)\/([^/]+)\/(.*)$/,
        replacement: path.join(__dirname, 'packages/$1/$2/src/$3'),
      },
      {
        find: /^@(foundation|adapters|domains)\/([^/]+)$/,
        replacement: path.join(__dirname, 'packages/$1/$2/src/index.ts'),
      },
      {
        find: /^(\.\.?\/.*)\.js$/,
        replacement: '$1',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
});
