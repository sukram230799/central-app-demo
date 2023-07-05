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
  import DetailsHandler from "../components/details-handler.svelte";

  import { onDestroy, onMount } from "svelte";

  import { central } from "../js/central";

  let subscriptions = [];
  import { pinnedClientsStore } from "../js/svelte-store";

  import { blinkLEDHandler } from "../js/operations/device-operations";
  import { disconnectClientHandler } from "../js/operations/client-operations";
  import { formatBytes, formatDate, formatYesNo } from "../js/formatter";
  import AutoDetailsHandler from "../components/auto-details-handler.svelte";
  import { errorToast } from "../js/operations/error-toast";

  export let client = {};
  let clientUnhandled = {};
  export let clientType;
  export let clientMAC = "";
  export let icons;

  let handledEntries = [];
  let notHandledEntries = [];

  let loaded = false;
  let loadClass = theme.ios
    ? "skeleton-text skeleton-effect-pulse"
    : "skeleton-text skeleton-effect-wave";
  let pinnedState = false;

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        pinnedClientsStore.subscribe(
          (pinnedClients) => (pinnedState = clientMAC in pinnedClients)
        )
      );

      // Normally the full details are already provided via routProps.
      // If the partial flag is set the previous view did not have all data.
      // This is the case for pinnedClients
      if (client.partial) {
        loaded = false;
      } else {
        loaded = true;
        loadClass = "";
        transfromData();
      }
      // Refresh/Load all client data
      loadData();
    })
  );

  // Remove all subscriptions
  onDestroy(() => {
    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
  });

  /**
   * Load or refresh all client data.
   * @returns {Promise} Resolves after done
   */
  function loadData() {
    return central
      .ready(1)
      .then(() => central.getClientDetails({ macaddr: clientMAC }))
      .then((clientDetails) => (client = clientDetails))
      .then(() => transfromData())
      .catch((e) => {
        errorToast(f7, e, { defaultTimeout: 2000 });
      })
      .finally(() => {
        loaded = true;
        loadClass = "";
      });
  }

  // Transform loaded data.
  // Split into handled entries and unhandled entries
  // handled will be displayed with own description,
  // While unhandled will display the field name
  function transfromData() {
    console.log(client);
    handledEntries = Object.keys(
      Object.assign({}, ...Object.values(getHandler()))
    );
    notHandledEntries = Object.keys(client).filter(
      (n) => !handledEntries.includes(n)
    );
    if (notHandledEntries.length)
      console.log(
        "Unhandled Entries for Client",
        clientType,
        clientMAC,
        notHandledEntries
      );

    clientUnhandled = Object.entries(client).reduce((obj, [key, value]) => {
      if (notHandledEntries.includes(key)) return { ...obj, [key]: value };
      return obj;
    }, {});
  }

  // Dummy Data
  const wirelessClient = {
    associated_device: "CNG0AP01FK",
    associated_device_mac: "80:8d:b7:aa:aa:aa",
    associated_device_name: "IAP-315",
    authentication_type: "",
    band: 5,
    channel: "124 (80 MHz)",
    client_type: "WIRELESS",
    connected_device_type: "AP",
    connection: "802.11ac, 802.11k, 802.11v",
    encryption_method: "WPA2_PSK",
    failure_stage: "",
    group_id: 2,
    group_name: "Home-AP-Group",
    health: 96,
    ht_type: 5,
    ip_address: "192.168.0.126",
    label_id: [],
    labels: [],
    last_connection_time: 1674028811000,
    macaddr: "30:ab:6a:aa:aa:aa",
    manufacturer: "SAMSUNG ELECTRO-MECHANICS(THAILAND)",
    maxspeed: 866,
    name: "SM-N986B",
    network: "WLAN-Aruba",
    os_type: "Samsung Android",
    phy_type: 1,
    radio_mac: "80:8d:b7:2a:aa:b0",
    radio_number: 0,
    signal_db: -39,
    signal_strength: 5,
    site: "BBN-Home",
    snr: 53,
    speed: 866,
    swarm_id: "a782cddd014c475d49bfb5fef62f5b312e358026137b1be38f",
    usage: 716730,
    user_role: "WLAN-Aruba",
    username: "--",
    vlan: 1,
  };

  const wiredClient = {
    associated_device: "CN8BSW01FK",
    associated_device_mac: "54:80:28:aa:aa:50",
    associated_device_name: "Aruba-2930F-8G-PoEP-2SFPP",
    authentication_type: "",
    band: "NA",
    channel: "NA",
    client_type: "WIRED",
    connected_device_type: "SWITCH",
    connection: "NA",
    encryption_method: "NA",
    failure_stage: "NA",
    group_id: 38,
    group_name: "SW-Template",
    interface_mac: "54:80:28:aa:aa:59",
    interface_port: "7",
    ip_address: "192.168.0.75",
    label_id: [],
    labels: [],
    last_connection_time: 1672885200000,
    macaddr: "00:1a:e8:aa:aa:aa",
    manufacturer: "Unify Software and Solutions GmbH & Co. KG",
    name: "00:1a:e8:aa:aa:aa",
    network: "NA",
    os_type: "--",
    site: "BBN-Home",
    snr: "NA",
    user_role: "unauthenticated",
    username: "--",
    vlan: 1,
  };

  // Entry handling
  // Custom per clientType handler
  const entriesWireless = {
    "Client Info": {
      name: "Name",
      ip_address: "IP",
      macaddr: "MAC",
      os_type: "OS Type",
      manufacturer: "Manufacturer",
      client_type: "Client Type",
    },
    "Wireless Info": {
      network: "Network",
      connection: "Connection",
      encryption_method: "Encryption",
      channel: "Channel",
      band: { title: "Band", unit: "GHz" },
      signal_db: { title: "Signal", unit: "dB" },
      signal_strength: "Signal Strength",
      snr: "SNR",
      speed: { title: "Speed", unit: "Mbps" },
      maxspeed: { title: "Speed (max)", unit: "Mbps" },
    },
    Role: {
      user_role: "User Role",
      username: "Username",
      vlan: "VLAN",
    },
    "AP Info": {
      connected_device_type: "Type",
      associated_device: {
        title: "Device",
        href: "/devices/details/",
        routeProps: (client) => ({
          device: {
            serial: client.associated_device,
            partial: true,
          },
          deviceType: "IAP",
          deviceSerial: client.associated_device,
        }),
      },
      associated_device_name: "Name",
      associated_device_mac: "MAC",
      group_name: "Group",
      radio_mac: "Radio MAC",
      radio_number: "Radio Number",
    },
  };
  const entriesWired = {
    "Client Info": {
      name: "Name",
      ip_address: "IP",
      macaddr: "MAC",
      os_type: "OS Type",
      manufacturer: "Manufacturer",
      client_type: "Client Type",
    },
    Role: {
      user_role: "User Role",
      username: "Username",
      vlan: "VLAN",
    },
    "Switch Info": {
      connected_device_type: "Type",
      associated_device: {
        title: "Device",
        href: "/devices/details/",
        routeProps: (client) => ({
          device: {
            serial: client.associated_device,
            partial: true,
          },
          deviceType: "SWITCH",
          deviceSerial: client.associated_device,
        }),
      },
      associated_device_name: "Name",
      associated_device_mac: "MAC",
      group_name: "Group",
      interface_mac: "Interface MAC",
      interface_port: "Interface Port",
    },
  };

  /**
   * Get the correct handler by clientType
   * @returns {} Entry Handler
   */
  function getHandler() {
    switch (clientType) {
      case "WIRELESS":
        return entriesWireless;
      case "WIRED":
        return entriesWired;
    }
    return {};
  }

  // Actions

  async function disconnectClient() {
    await disconnectClientHandler(f7, client);
  }

  let ledBlinking = false;

  async function blinkLED() {
    ledBlinking = await blinkLEDHandler(
      f7,
      client.associated_device,
      ledBlinking
    );
  }

  function pinClient() {
    if (pinnedState) {
      pinnedClientsStore.delete(clientMAC);
      f7.toast.show({
        text: `Unpinned`,
        closeTimeout: 2000,
      });
    } else {
      pinnedClientsStore.add({ ...client, icons });
      f7.toast.show({
        text: `Pinned`,
        closeTimeout: 2000,
      });
    }
  }

  // More data loading
  function loadMore(done) {
    loadData().then(() => done());
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar
    title={client.name ? client.name : clientMAC + pinnedState ? " - (P)" : ""}
    backLink="Back"
  >
    <NavRight>
      <Link
        iconIos={pinnedState ? "f7:pin_slash" : "f7:pin"}
        iconAurora={pinnedState ? "f7:pin_slash" : "f7:pin"}
        iconMd={pinnedState ? "icon:mdi mdi-pin-off" : "icon:mdi mdi-pin"}
        tooltip={pinnedState ? "Unpin Client" : "Pin Client"}
        on:click={pinClient}
      />
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

  <BlockTitle>Actions</BlockTitle>
  <Block strong>
    <Row style="justify-content: normal;">
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:lightbulb"
          iconAurora="f7:lightbulb"
          iconMd="material:lightbulb"
          on:click={blinkLED}
          tooltip="Blink LED"
          text="Blink LED"
        />
      </Col>
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:power"
          iconAurora="f7:power"
          iconMd="material:power_settings_new"
          tooltip="Disconnect Client"
          text="Disconnect"
          on:click={disconnectClient}
        />
      </Col>
    </Row>
  </Block>

  <DetailsHandler {getHandler} {loadClass} details={client} />

  <AutoDetailsHandler {loadClass} detailsUnhandled={clientUnhandled} />
</Page>
