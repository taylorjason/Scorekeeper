import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, writeFileSync } from 'fs';

// Read + auto-increment build number on every build
const buildFile = new URL('./build-number.json', import.meta.url).pathname;
const buildData = JSON.parse(readFileSync(buildFile, 'utf-8')) as { build: number };
buildData.build += 1;
writeFileSync(buildFile, JSON.stringify(buildData) + '\n');

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = buildData.build;
const BUILD_TIME = new Date().toISOString();

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_NUMBER__: BUILD_NUMBER,
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'Game Night Scorekeeper',
        short_name: 'Scorekeeper',
        description: 'Track scores and stats for game nights',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
