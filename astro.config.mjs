import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [react()],
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
      exclude: ['astro/assets/services/noop', '@astrojs/cloudflare'],
    },
    ssr: {
      noExternal: ['react', 'react-dom', '@gsap/react', '@astrojs/react'],
    },
  },
});
