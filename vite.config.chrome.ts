import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    outDir: 'dist_chrome',
    rollupOptions: {
      // Keep the manifest popup as an explicit Vite HTML entry. This makes
      // Vite transform the TSX module instead of serving it as a static file.
      input: {
        popup: 'src/pages/popup/index.html',
        sites: 'src/pages/sites/index.html',
        settings: 'src/pages/settings/index.html',
      },
    },
  },
  clearScreen: false,
});
