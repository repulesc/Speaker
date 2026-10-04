import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Relative base so the build works under any GitHub Pages path.
  base: './',
  plugins: [svelte()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
