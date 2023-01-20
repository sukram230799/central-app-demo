
// Import Framework7
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-Svelte Plugin
import Framework7Svelte from 'framework7-svelte';

// Import Framework7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.scss';
import '@mdi/font/css/materialdesignicons.css'

// Import App Component
import App from '../components/app.svelte';
import { needRefreshStore, offlineReadyStore } from './svelte-store';

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() { console.log('onNeedRefresh'); needRefreshStore.set({ updateAvailable: true, updateSW }) },
  onOfflineReady() { console.log('onOfflineReady'); offlineReadyStore.set({ offlineReady: true }) },
});

// Init F7 Svelte Plugin
Framework7.use(Framework7Svelte)

// Mount Svelte App
const app = new App({
  target: document.getElementById('app'),
  view: {
    browserHistory: true,
    browserHistoryRoot: '/'
  },
});
