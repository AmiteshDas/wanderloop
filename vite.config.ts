import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this as a project site at /wanderloop/; everything else uses root.
const base = process.env.GITHUB_PAGES ? '/wanderloop/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Wanderloop',
        short_name: 'Wanderloop',
        description: 'Say how long you want to walk, get a loop route from where you are, and follow it.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // CARTO basemap style/vector tiles/glyphs/sprites: cache-first so previously viewed areas work offline.
            urlPattern: /^https:\/\/[a-z0-9-]*\.?cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'basemap-tiles',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OSRM routing responses: network-first, short-lived fallback cache.
            urlPattern: /^https:\/\/routing\.openstreetmap\.de\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'osrm-routes',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
