<script>
  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    f7ready,
    f7,
    theme,
    ListItem,
    Icon,
    List,
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import { central } from "../js/central";
  import { errorToast } from "../js/operations/error-toast";

  let notifications = [];
  let notifiactionTypes = [];

  let loaded = false;
  let loadClass = theme.ios
    ? "skeleton-text skeleton-effect-pulse"
    : "skeleton-text skeleton-effect-wave";

  onMount(() =>
    f7ready(() => {
      loadData();
    })
  );

  function loadData() {
    return central
      .ready()
      .then(() => central.listNotificationTypes())
      .then(
        (notifiactionTypesResponse) =>
          (notifiactionTypes = notifiactionTypesResponse.types)
      )
      .then(() => central.listNotifications({ from_timestamp: 1672731167 }))
      .then(
        (notifactionResponse) =>
          (notifications = notifactionResponse.notifications)
      )
      .catch((e) => errorToast(f7, e))
      .finally(() => (loaded = true));
  }

  function getSeverityIcon(notifiaction) {
    switch (notifiaction.severity) {
      case "Warning":
        return {
          ios: "material:cable",
          aurora: "material:cable",
          md: "material:cable",
        };
      default:
        return {
          ios: "material:cable",
          aurora: "material:cable",
          md: "material:cable",
        };
    }
  }

  function getNotificationType(notifiaction) {
    return notifiactionTypes.find((nType) => nType.name == notifiaction.type);
  }
</script>

<Page>
  <Navbar title="Notification" backLink="Back" />
  <BlockTitle>Notifications</BlockTitle>
  <List>
    {#each notifications as notification}
      <ListItem
        footer={notification.description.split("\n")[0]}
        title={getNotificationType(notification).desc}
        header={notification.severity}
        href="/notifications/details/"
        routeProps={{
          notification: notification,
        }}
      />
    {/each}
  </List>
</Page>
