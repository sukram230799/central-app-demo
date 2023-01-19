import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', event => {
    let data = event.data.json();
    const image = 'https://central.wuest.dev/icons/512x512.png';
    const options = {
        body: data.options.body,
        icon: image
    }
    self.registration.showNotification(
        data.title,
        options
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow('https://web.dev'));
});


self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'api-key-renewal') {
        event.waitUntil(renewKey());
    }
});
