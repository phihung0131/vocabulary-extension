import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@popup': path.resolve(__dirname, './src/popup'),
      '@options': path.resolve(__dirname, './src/options'),
      '@background': path.resolve(__dirname, './src/background'),
      '@content': path.resolve(__dirname, './src/content'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/index.html'),
        options: path.resolve(__dirname, 'src/options/index.html'),
      },
    },
  },
});
