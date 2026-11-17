import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Iconpanel.png', 'images/**/*'],
      manifest: {
        name: 'PANELIN — Smart Wallpanel Estimator',
        short_name: 'PANELIN',
        description: 'Aplikasi simulasi 2D dan kalkulator RAB material WPC, Wallboard, & UV Marble',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/Iconpanel.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/Iconpanel.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpeg,jpg,svg}'],
      },
    }),
  ],
});