
import HomePage from '../pages/home.svelte';
import AboutPage from '../pages/about.svelte';
import LicensePage from '../pages/licenses.svelte';
import FormPage from '../pages/form.svelte';
// import FirmwarePage from '../pages/firmware.svelte';
import ClientsPage from '../pages/clients.svelte';
import ClientDetailsPage from '../pages/client-details.svelte';
import DevicesPage from '../pages/devices.svelte';
import DeviceDetailsPage from '../pages/device-details.svelte';
import CameraSettingsPage from '../pages/settings-camera.svelte';
import CentralSettingsPage from '../pages/settings-central.svelte';
import TroubleshootingPage from '../pages/troubleshooting.svelte';
import TroubleshootingDetailsPage from '../pages/troubleshooting-details.svelte';
import GroupsPage from '../pages/groups.svelte';
import GroupDetailsPage from '../pages/group-details.svelte';
import GroupCreatePage from '../pages/group-create.svelte';
import NotificationsPage from '../pages/notifications.svelte';
import NotificationDetailsPage from '../pages/notification-details.svelte';


import DynamicRoutePage from '../pages/dynamic-route.svelte';
import RequestAndLoad from '../pages/request-and-load.svelte';
import NotFoundPage from '../pages/404.svelte';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  // {
  //   path: '/firmware/',
  //   component: FirmwarePage,
  // },
  {
    path: '/clients/',
    component: ClientsPage,
  },
  {
    path: '/clients/details/',
    component: ClientDetailsPage,
  },
  {
    path: '/devices/',
    component: DevicesPage,
  },
  {
    path: '/devices/details/',
    component: DeviceDetailsPage,
  },
  {
    path: '/troubleshooting/',
    component: TroubleshootingPage,
  },
  {
    path: '/troubleshooting/details',
    component: TroubleshootingDetailsPage,
  },
  {
    path: '/groups/',
    component: GroupsPage,
  },
  {
    path: '/groups/create/',
    component: GroupCreatePage,
  },
  {
    path: '/groups/details/',
    component: GroupDetailsPage,
  },
  {
    path: '/notifications/',
    component: NotificationsPage,
  },
  {
    path: '/notifications/details',
    component: NotificationDetailsPage,
  },
  {
    path: '/settings/camera',
    component: CameraSettingsPage,
  },
  {
    path: '/settings/central',
    component: CentralSettingsPage,
  },
  {
    path: '/about/',
    component: AboutPage,
  },
  {
    path: '/license/',
    component: LicensePage,
  },
  {
    path: '/form/',
    component: FormPage,
  },


  {
    path: '/dynamic-route/blog/:blogId/post/:postId/',
    component: DynamicRoutePage,
  },
  {
    path: '/request-and-load/user/:userId/',
    async: function ({ router, to, resolve }) {
      // App instance
      var app = router.app;

      // Show Preloader
      app.preloader.show();

      // User ID from request
      var userId = to.params.userId;

      // Simulate Ajax Request
      setTimeout(function () {
        // We got user data from request
        var user = {
          firstName: 'Vladimir',
          lastName: 'Kharlampidi',
          about: 'Hello, i am creator of Framework7! Hope you like it!',
          links: [
            {
              title: 'Framework7 Website',
              url: 'http://framework7.io',
            },
            {
              title: 'Framework7 Forum',
              url: 'http://forum.framework7.io',
            },
          ]
        };
        // Hide Preloader
        app.preloader.hide();

        // Resolve route to load page
        resolve(
          {
            component: RequestAndLoad,
          },
          {
            props: {
              user: user,
            }
          }
        );
      }, 1000);
    },
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
