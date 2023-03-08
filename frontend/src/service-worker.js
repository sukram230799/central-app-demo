import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING')
        self.skipWaiting();
});


self.addEventListener('push', event => {
    let data = event.data.json();
    const image = 'https://central.wuest.dev/icons/512x512.png';
    const options = {
        body: data.description,
        icon: image
    }
    self.registration.showNotification(
        data.alert_type,
        options
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(`https://${process.env.HOST}`));
});


self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'api-key-renewal') {
        event.waitUntil(renewKey());
    }
});
