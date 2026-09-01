import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: 'https://bella-forever.pages.dev',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api'),
    }),
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/admin/*', '/api', '/api/*'],
        },
      ],
      sitemap: true,
    }),
  ],
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
