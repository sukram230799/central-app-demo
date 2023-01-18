// import { injectManifest } from 'workbox-build';
// const injectManifest = require('workbox-build').injectManifest;

// injectManifest({});
module.exports = {
  swSrc: 'src/push-worker.js',
  swDest: 'www/push-worker.js',
  globDirectory: 'www',
  globPatterns: [
    '**/*.{woff,woff2,js,css,png,jpg,svg,html}'
  ],
  globIgnores: [],
  // ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};


// module.exports = {
//   globDirectory: 'www/',
//   globPatterns: ['**/*.{woff,woff2,js,css,png,jpg,svg,html}'],
//   /* pass array of globs to exclude from caching */
//   globIgnores: [],
//   ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
//   swDest: 'www/service-worker.js',
// };
