<script>
  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    List,
    ListItem,
    f7,
  } from "framework7-svelte";
  import { get } from "svelte/store";
  import { errorToast } from "../js/operations/error-toast";
  import { push } from "../js/push";
  import { notificationSettingsStore, webhookStore } from "../js/svelte-store";

  export let category;
  export let alerts = [];

  let selectedAlerts = Array(alerts.length);

  notificationSettingsStore.subscribe((settings) => {
    let wid = get(webhookStore);
    selectedAlerts = alerts.map((alert) => {
      let setting = settings.find((setting) => setting.type === alert.name);
      if (!setting?.active) return false;
      return !!setting?.rules?.find((rule) => rule?.webhooks?.includes(wid));
    });
  });

  function onCheckedChange(e, alert, index) {
    let checked = e.target.checked;
    f7.preloader.show();
    if (checked) {
      push
        .addAlert(alert)
        .then(() => (selectedAlerts[index] = true))
        .catch((e) => errorToast(f7, e))
        .finally(() => f7.preloader.hide());
    } else {
      push
        .removeAlert(alert)
        .then(() => (selectedAlerts[index] = false))
        .catch((e) => errorToast(f7, e))
        .finally(() => f7.preloader.hide());
    }
  }
</script>

<Page>
  <Navbar title="Alerts" backLink="Back" />
  <BlockTitle>Alerts</BlockTitle>
  <List>
    {#each alerts as alert, index}
      <ListItem
        title={alert.desc}
        footer={alert.name}
        checkbox="true"
        checked={selectedAlerts[index]}
        onChange={(e) => onCheckedChange(e, alert, index)}
      />
    {/each}
  </List>
</Page>
