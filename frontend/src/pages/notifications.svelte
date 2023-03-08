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
      .then(() =>
        central.listNotifications({
          from_timestamp: Math.floor(Date.now() / 1000 - 60 * 60 * 24 * 30),
        })
      )
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

  function loadMore(done) {
    loadData().then(() => done());
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar title="Notifications" backLink="Back" />
  <BlockTitle>Notifications</BlockTitle>

  {#if !loaded}
    <List>
      {#each ["Critical", "Major", "Minor", "Warning", "Critical", "Major", "Minor", "Warning", "Critical", "Major", "Minor", "Warning"] as severity}
        <ListItem
          class={theme.ios
            ? "skeleton-text skeleton-effect-pulse"
            : "skeleton-text skeleton-effect-wave"}
          header={severity + " - " + "2023-03-04 09:46:07 UTC"}
          title="Notification Type"
          footer={("x".repeat(80) + "\n").repeat(3)}
          href="#"
        />
      {/each}
    </List>
  {/if}
  <List>
    {#each notifications as notification}
      <ListItem
        header={notification.severity + " - " + notification.details.time}
        title={getNotificationType(notification).desc}
        footer={notification.description.split("\n")[0]}
        href="/notifications/details/"
        routeProps={{
          notification: notification,
        }}
      >
        {#if notification.acknowledged}
          <Icon
            color
            slot="after"
            ios="f7:checkmark_alt"
            aurora="f7:checkmark_alt"
            md="material:done"
          />
        {/if}
      </ListItem>
    {/each}
    {#if loaded && !notifications?.length}
      <ListItem>No entries</ListItem>
    {/if}
  </List>
</Page>
