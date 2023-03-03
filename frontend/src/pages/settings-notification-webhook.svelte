<script>
  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    Row,
    Col,
    Button,
    Link,
    f7,
    Tab,
    Tabs,
    List,
    Toolbar,
    ListItem,
    f7ready,
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import { each } from "svelte/internal";
  const debug = process.env.NODE_ENV !== "production";

  import { central } from "../js/central";
  import { errorToast } from "../js/operations/error-toast";

  import { push } from "../js/push";

  let notificationTypes = {};

  onMount(() =>
    f7ready(() => {
      central
        .ready()
        .then(() => central.listNotificationTypes())
        .then(
          (notificationTypesResponse) =>
            (notificationTypes = notificationTypesResponse.types.reduce(
              (accu, value) => {
                if (!(value.category in accu)) accu[value.category] = [];
                accu[value.category].push(value);
                return accu;
              },
              {}
            ))
        )
        .then(() => central.listNotificationSettings());
    })
  );
</script>

<Page>
  <Navbar title="Alerts Configuration" backLink="Back" />
  <BlockTitle>Manage Alerts</BlockTitle>
  <Block>This may break your existing alerts. Use with caution.</Block>

  <List>
    {#each Object.entries(notificationTypes) as [key, value]}
      <ListItem
        title={key}
        href="/settings/notification/alerts/category"
        routeProps={{ category: key, alerts: value }}
      />
    {/each}
  </List>
</Page>
