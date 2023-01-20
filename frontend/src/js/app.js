import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() { console.log('On Need Refresh') },
  onOfflineReady() { console.log('On Offline Ready') },
});

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
