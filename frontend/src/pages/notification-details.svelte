<script>
  import {
    f7,
    f7ready,
    theme,
    Page,
    Navbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    Searchbar,
    Row,
    Col,
  } from "framework7-svelte";

  import { onDestroy, onMount } from "svelte";

  import DetailsHandler from "../components/details-handler.svelte";
  import AutoDetailsHandler from "../components/auto-details-handler.svelte";
  import { errorToast } from "../js/operations/error-toast";
  import { durationFormatter } from "human-readable";
  import { formatBytes, formatDate, formatYesNo } from "../js/formatter";

  export let notification = {};
  let notificationUnhandled = {};
  console.log(notification);

  function transfromData() {
    console.log(notification);
    handledEntries = Object.keys(
      Object.assign({}, ...Object.values(getHandler()))
    );
    notHandledEntries = Object.keys(notification).filter(
      (n) => !handledEntries.includes(n)
    );
    if (notHandledEntries.length)
      console.log(
        "Unhandled Entries for Notification",
        notification,
        notHandledEntries
      );

    notificationUnhandled = Object.entries(notification).reduce(
      (obj, [key, value]) => {
        if (notHandledEntries.includes(key)) return { ...obj, [key]: value };
        return obj;
      },
      {}
    );
  }

  onMount(() =>
    f7ready(() => {
      transfromData();
    })
  );

  let handledEntries = [];
  let notHandledEntries = [];

  // Dummy Data
  const dummyAlert = {
    acknowledged: false,
    created_timestamp: 1677145316.0,
    customer_id: "da3...",
    description:
      "Config change detected on group Home-AP-Group for device type IAP by user user.name@example.com.\n\nSerial: , \nMacAddress: , \nConfig Content: Configuration Updated\nwlan access-rule Admin\n  no captive-portal\nexit",
    details: {
      __base_url: "https://internal-ui.central.arubanetworks.com",
      _rule_number: "0",
      config_change:
        "Configuration Updated\nwlan access-rule Admin\n  no captive-portal\nexit",
      dev_type: "IAP",
      group: "2",
      group_name: "Home-Group",
      labels: "",
      macaddr: "",
      params: "",
      serial: "",
      time: "2023-02-23 09:41:56 UTC",
      user: "user.name@example.com",
    },
    device_id: null,
    group_name: "Home-AP-Group",
    id: "AYZ9ppzcdpz-VVbhKlBm",
    labels: [],
    nid: 2000,
    setting_id: "da3...",
    severity: "Warning",
    state: "Open",
    timestamp: 1677145316.0,
    type: "DEVICE_CONFIG_CHANGE_DETECTED",
  };

  // Entry handling
  // Custom per category handler
  const entries = {
    Details: {
      description: { title: "Details", asFooter: true },
      created_timestamp: {
        title: "Date Created",
        format: durationFormatter(),
        multiplier: 1,
      },
      timestamp: {
        title: "Date",
        format: durationFormatter(),
        multiplier: 1,
      },
      acknowledged: { title: "Acknowledged", format: formatYesNo },
      severity: "Severity",
      group_name: "Group",
      state: "State",
      type: "Type",
    },
  };

  /**
   * Get the correct handler by notificationType
   * @returns {} Entry Handler
   */
  function getHandler() {
    switch (true) {
      case true:
        return entries;
    }
  }

  // Actions
</script>

<Page>
  <Navbar title={notification.type} backLink="Back">
    <NavRight>
      <Link
        searchbarEnable=".searchbar-details"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
      />
    </NavRight>
    <Searchbar
      class="searchbar-details"
      expandable
      searchContainer=".search-list"
      searchIn=".item-title, .item-after"
      disableButton={!theme.aurora}
    />
  </Navbar>

  <DetailsHandler {getHandler} loadClass="" details={notification} />

  <AutoDetailsHandler loadClass="" detailsUnhandled={notificationUnhandled} />
</Page>
