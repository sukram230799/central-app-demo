import path from 'path';
// import { svelte } from '@sveltejs/vite-plugin-svelte';

const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www',);

module.exports = async function () {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte');
  const { reactivePreprocess } = require("svelte-reactive-preprocessor");
  const { VitePWA } = await import('vite-plugin-pwa');
  return {
    plugins: [
      svelte({
        // preprocess: [reactivePreprocess()],
      }),
      VitePWA({
        workbox: {
          cleanupOutdatedCaches: true,
        },
        strategies: 'injectManifest',
        srcDir: '',
        injectManifest: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: [
            '**/*.{woff,woff2,js,css,png,jpg,svg,html}'
          ],
          globIgnores: [],
          globDirectory: 'www',
        },
        filename: 'service-worker.js'
      })
    ],
    root: SRC_DIR,
    base: '',
    publicDir: PUBLIC_DIR,
    build: {
      sourceMap: true,
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
      },
    },
    resolve: {
      alias: {
        '@': SRC_DIR,
      },
    },
    server: {
      host: true,
      port: 25799,
      proxy: {
        '^/webhook.*': {
          target: 'http://localhost:26799',
          changeOrigin: true,
          configure: (proxy, options) => {
            // proxy will be an instance of 'http-proxy'
          },
        },
        '/api-proxy': {
          target: 'http://localhost:26799',
          changeOrigin: true,
          configure: (proxy, options) => {
            // proxy will be an instance of 'http-proxy'
          },
        },
      },
    },
  }
};
