import axios from "axios";
import { central } from "./central";

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY;

class Push {

  async registerServiceWorker() {
    return await navigator.serviceWorker
      .register("./service-worker.dev.js")

  }

  async unregisterServiceWorker() {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.unregister();
  }

  async registerPush() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    let backendResponse = await axios.post(`${window.location.origin}/webhook-register`,
      subscription);

    let url = backendResponse.data.url;

    let webhooks = await central.listWebhooks();
    let webhook = webhooks.settings.find(webhook => webhook.name === central.generateWebhookName());

    if (webhook)
      await central.updateWebhook({ wid: webhook.wid, url })
    else
      await central.addWebhook({ url });
  }

  async unregisterPush() {
    let webhooks = await central.listWebhooks();
    let webhook = webhooks.settings.find(webhook => webhook.name === central.generateWebhookName());

    if (webhook)
    return await central.deleteWebhook({ wid: webhook.wid });
    else return true;
  }

  async notifyMe() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration.pushManager.getSubscription();

    let response = await axios.post(`${window.location.origin}/webhook-test`,
      { subscription });

    return response;
  }

  /* Utility functions. */

  // Convert a base64 string to Uint8Array.
  // Must do this so the server can understand the VAPID_PUBLIC_KEY.
  urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const push = new Push();
