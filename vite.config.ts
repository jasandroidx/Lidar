import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg', 'grid.geojson', 'overlay_info.json'],
        manifest: {
          id: '/',
          name: 'Pike Terrain Radar PWA',
          short_name: 'PikeRadar',
          description: 'Field GPS navigation & real-time LiDAR canopy-peel radar for Pike County, Indiana historical pioneer sites.',
          theme_color: '#081714',
          background_color: '#030a08',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // NEVER precache the LRM pyramid -- county-wide that is ~9 GB of PNGs
          // and it would be shoved into the service worker on install.
          // They are cached on demand below instead, which also means the tiles
          // you actually looked at stay available in the field with no signal.
          globPatterns: ['**/*.{js,css,html,ico,svg,json,webmanifest}', 'pwa-*.png', 'apple-touch-icon.png'],
          globIgnores: ['**/lrm_tiles/**'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              // locally served LRM tiles: cache what the user actually views
              urlPattern: /\/lrm_tiles\/.*\.png$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'lrm-tiles',
                expiration: {
                  maxEntries: 3000,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/.*tile\.openstreetmap\.org\/.*$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/.*$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'esri-tiles',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/(candidates|grid|overlay_info|lrm_overlay\.png|chips\/.*)/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'pike-radar-api',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
