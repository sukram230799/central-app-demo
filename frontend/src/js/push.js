import axios from "axios";
import { get } from "svelte/store";
import { central } from "./central";
import { webhookStore } from "./svelte-store";

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY;

class Push {

  async registerServiceWorkerDEV() {
    return await navigator.serviceWorker
      .register("./service-worker.dev.js")
  }

  async unregisterServiceWorkerDEV() {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.unregister();
  }

  async registerPush() {
    // Get current Service-Worker Registration
    const registration = await navigator.serviceWorker.getRegistration();
    // Create Push-Notification subscription with public VPAID Key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Post the subscription details to backend to get URL for Central to contact via Webhook
    let backendResponse = await axios.post(`${window.location.origin}/webhook-register`,
      subscription);

    // Extract URL
    let url = backendResponse.data.url;

    // Get all current registered Webhooks from central
    let webhooks = await central.listWebhooks();
    // Check if we have already a registration. Name is unique for every credential
    let webhook = webhooks.settings.find(webhook => webhook.name === central.generateWebhookName());

    let wid;
    if (webhook) {
      // Webhook exists. Update with (presumabely) new URL
      wid = webhook.wid
      await central.updateWebhook({ wid, url })
    }
    else {
      // Webhook not known. Add net webhook.
      let result = await central.addWebhook({ url });
      wid = result.wid;
    }

    // Save webhook id for Credential. Needed to subscribe to Alerts
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
    // Get current Service-Worker Registration
    const registration = await navigator.serviceWorker.getRegistration();
    // Get current Push Subscription
    const subscription = await registration.pushManager.getSubscription();

    // Send subscription to backend to test push
    let response = await axios.post(`${window.location.origin}/webhook-test`,
      { subscription });

    return response;
  }

  async filterWebhooks(webhooks) {
    // Get webhooks from central
    let validWebhooks = (await central.listWebhooks()).settings.map(webhook => webhook.wid);
    // Filter against validWebhooks
    return webhooks.filter(webhook => validWebhooks.includes(webhook));
  }

  async addAlert(alert) {
    // Get all alert/notification settings
    let alertSettings = await central.listNotificationSettings();
    // Find the setting matching with provided name (name is equivalent to type)
    let alertSetting = alertSettings.settings.find(alertSetting => alertSetting.type === alert.name);

    // Get our current webhook id
    let wid = get(webhookStore);

    if (alertSetting) {
      // Setting already exists. Update with new webhook.
      // Rules is array but only first entry used by Central. (For now) 
      // TODO: Clarify with API-Team
      let rules = alertSetting.rules;

      if (rules === undefined) {
        // No rule defined. Create rule with only the webhook
        rules = {
          severity: "Warning",
          delivery_options: ["Webhook"],
          webhooks: [wid]
        }
      }
      else {
        if (!rules[0].delivery_options) {
          // No delivery option set -> No webhooks configured
          rules[0].delivery_options = ['Webhook'];
          rules[0].webhooks = [];
        }
        else if (!rules[0].delivery_options.includes("Webhook")) {
          // Webhook not configured as delivery option -> Add Webhook and create webhooks 
          rules[0].delivery_options.push("Webhook");
          rules[0].webhooks = [];
        }
        // Add our webhook to array of subscribers
        rules[0].webhooks.push(wid)

        // Central doesn't filter out old/stale webhooks.
        // So we do it for them...
        rules[0].webhooks = await this.filterWebhooks(rules[0].webhooks);
      }

      // Update with new settings
      await central.updateNotificationSetting({
        settings_id: alertSetting.id, setting: {
          ...alertSetting,
          active: true,
          rules: rules
        }
      });
    } else {
      // Add entirely new settings
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
    // Refresh Notification Setting -> Auto updated in Store
    await central.listNotificationSettings();
  }

  async removeAlert(alert) {
    // Get all alert/notification settings
    let alertSettings = await central.listNotificationSettings();
    // Find the setting matching with provided name (name is equivalent to type)
    let alertSetting = alertSettings.settings.find(alertSetting => alertSetting.type === alert.name);

    // Get our current webhook id
    let wid = get(webhookStore);

    if (alertSetting) {
      // We do have a setting

      let rules = alertSetting.rules;

      if (rules[0].webhooks) {
        // Remove our webhook from the array
      rules[0].webhooks.splice(rules[0].webhooks.indexOf(wid), 1);

        // Central doesn't filter out old/stale webhooks.
        // So we do it for them...
      rules[0].webhooks = await this.filterWebhooks(rules[0].webhooks);
      }

      if (!rules[0].webhooks.length) {
        // Webhooks are empty. Remove the delivery option and the array
        rules[0].delivery_options.splice(rules[0].delivery_options.indexOf("Webhook"), 1);
        rules[0].webhooks = undefined;
      }

      // Update with new settings
      await central.updateNotificationSetting({
        settings_id: alertSetting.id, setting: {
          active: true,
          rules: rules,
          type: alertSetting.type
        }
      });

      // Refresh Notification Setting -> Auto updated in Store
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
