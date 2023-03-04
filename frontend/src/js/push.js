import axios from "axios";
import { get } from "svelte/store";
import { central } from "./central";
import { webhookStore } from "./svelte-store";

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

    let wid;

    if (webhook) {
      wid = webhook.wid
      await central.updateWebhook({ wid, url })
    }
    else {
      let result = await central.addWebhook({ url });
      wid = result.wid;
    }

    webhookStore.update(wid);
  }

  async unregisterPush() {
    let webhooks = await central.listWebhooks();
    let webhook = webhooks.settings.find(webhook => webhook.name === central.generateWebhookName());

    let result;

    if (webhook)
      result = await central.deleteWebhook({ wid: webhook.wid });
    else result = true;

    // Remove wid/webhook id
    webhookStore.update(null);

    return result;
  }

  async notifyMe() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration.pushManager.getSubscription();

    let response = await axios.post(`${window.location.origin}/webhook-test`,
      { subscription });

    return response;
  }

  async addAlert(alert) {
    let alertSettings = await central.listNotificationSettings();
    let alertSetting = alertSettings.settings.find(alertSetting => alertSetting.type === alert.name);

    let wid = get(webhookStore);

    if (alertSetting) {
      let rules = alertSetting.rules;

      rules[0].webhooks.push(wid)
      if (!rules[0].delivery_options.includes("Webhook")) rules[0].delivery_options.push("Webhook")

      await central.updateNotificationSetting({
        settings_id: alertSetting.id, setting: {
          ...alertSetting,
          active: true,
          rules: rules
        }
      });
    } else {
      await central.addNotificationSetting({
        type: alert.name, active: true, rules: [
          {
            severity: "Warning",
            delivery_options: ["Webhook"],
            webhooks: [wid]
          }
        ]
      });
    }
    await central.listNotificationSettings();
  }

  async removeAlert(alert) {
    let alertSettings = await central.listNotificationSettings();
    let alertSetting = alertSettings.settings.find(alertSetting => alertSetting.type === alert.name);

    let wid = get(webhookStore);
    if (alertSetting) {
      let rules = alertSetting.rules;

      rules[0].webhooks.splice(rules[0].webhooks.indexOf(wid), 1);
      if (!rules[0].webhooks.length) rules[0].delivery_options.splice(rules[0].delivery_options.indexOf("Webhook"), 1);

      await central.updateNotificationSetting({
        settings_id: alertSetting.id, setting: {
          ...alertSetting,
          active: true,
          rules: rules
        }
      });
      await central.listNotificationSettings();
    }
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
