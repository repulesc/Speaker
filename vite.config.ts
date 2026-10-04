import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { APP_NAME, APP_SHORT_NAME } from './src/app/config.ts';

/** Puts the product name from src/app/config.ts into index.html and the PWA manifest. */
function appName(): Plugin {
  return {
    name: 'app-name',
    transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', APP_NAME),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(
          {
            name: APP_NAME,
            short_name: APP_SHORT_NAME,
            start_url: './',
            scope: './',
            display: 'standalone',
            background_color: '#0b1626',
            theme_color: '#0b1626',
            icons: [
              { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            ],
          },
          null,
          2,
        ),
      });
    },
    configureServer(server) {
      // The dev server has no emitted bundle: serve the same manifest on request.
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(
          JSON.stringify({ name: APP_NAME, short_name: APP_SHORT_NAME, display: 'standalone' }),
        );
      });
    },
  };
}

export default defineConfig({
  // Relative base so the build works under any GitHub Pages path.
  base: './',
  plugins: [svelte(), appName()],
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
