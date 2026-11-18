import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const base = '/gas-price-calculator/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gas price calculator',
        short_name: 'Gas price',
        description: 'Convert pump prices, fuel economy, fill-ups and electric charging costs.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f6f6f6',
        theme_color: '#f6f6f6',
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Only the app shell is cached. Frankfurter requests are not intercepted,
        // so rates still come from the network or the localStorage cache in rate.js.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
  base,
})
