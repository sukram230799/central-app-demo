<script>
  import {
    theme,
    f7,
    f7ready,
    Page,
    Navbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    List,
    ListItem,
    Searchbar,
    Icon,
    Row,
    Col,
    Button,
  } from "framework7-svelte";
  import { central } from "../js/central";
  import { pinnedClientsStore } from "../js/svelte-store";

  export let client;
  let loaded = false;
  let loadClass = theme.ios
    ? "skeleton-text skeleton-effect-pulse"
    : "skeleton-text skeleton-effect-wave";
  let pinnedState = false;

  pinnedClientsStore.subscribe(
    (pinnedClients) => (pinnedState = client.macaddr in pinnedClients)
  );

  if (client.partial) {
    loaded = false;
    loadData();
  } else {
    loaded = true;
    loadClass = "";
  }

  function loadData() {
    return central
      .ready(1)
      .then(() => central.getClientDetails({ macaddr: client.macaddr }))
      .then((clientDetails) => (client = clientDetails))
      .catch((e) => {
        f7.toast.show({ text: JSON.stringify(e), setTimeout: 10000 });
      })
      .finally(() => {
        loaded = true;
        loadClass = "";
      });
  }
  /*
    client = {
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

    client = {
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
    }; */

  console.log(client);

  let handledEntriesWireless = {
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
      signal_db: "Signal dB",
      signal_strength: "Signal Strength",
      snr: "SNR",
      speed: "Speed",
      maxspeed: "Speed (max)",
    },
    Role: {
      user_role: "User Role",
      username: "Username",
      vlan: "VLAN",
    },
    "AP Info": {
      connected_device_type: "Type",
      associated_device: "Device",
      associated_device_name: "Name",
      associated_device_mac: "MAC",
      group_name: "Group",
      radio_mac: "Radio MAC",
      radio_number: "Radio Number",
    },
  };

  let handledEntriesWired = {
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
      associated_device: "Device",
      associated_device_name: "Name",
      associated_device_mac: "MAC",
      group_name: "Group",
      interface_mac: "Interface MAC",
      interface_port: "Interface Port",
    },
  };

  let disconnectToast;

  async function disconnectClient() {
    f7.dialog.confirm(
      `Disconnect the following client?<br>${
        client.name ? "Name: " + client.name + ",<br>" : ""
      }MAC: ${client.macaddr},<br>IP: ${client.ip_address}`,
      "Disconnect Client?",
      async () => {
        f7.preloader.show();
        let result = await central.disconnectUser({
          serial: client.associated_device,
          disconnect_user_mac: client.macaddr,
        });
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          let status = await central.getStatus({
            task_id: result.task_id,
          });
          if (status.state !== "QUEUED") {
            if (status.state === "SUCCESS") {
              disconnectToast = f7.toast.create({
                text: `Client disconnected`,
                closeTimeout: 2000,
              });
              disconnectToast.open();
            }
            f7.preloader.hide();
            break;
          }
        }
      }
    );
  }

  let ledBlinking = false;
  let ledToast;

  async function blinkLED() {
    f7.preloader.show();
    let result;
    console.log(`LED Blink, current state ${ledBlinking ? "On" : "Off"}`);

    if (!ledBlinking)
      result = await central.blinkLEDOn({ serial: client.associated_device });
    else
      result = await central.blinkLEDOff({ serial: client.associated_device });

    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      let status = await central.getStatus({
        task_id: result.task_id,
      });
      if (status.state !== "QUEUED") {
        if (status.state === "SUCCESS") {
          ledBlinking = !ledBlinking;
          ledToast = f7.toast.create({
            text: `Led turned ${ledBlinking ? "on" : "off"}`,
            closeTimeout: 2000,
          });
          ledToast.open();
        }
        f7.preloader.hide();
        break;
      }
    }
  }

  function pinClient() {
    if (pinnedState) {
      pinnedClientsStore.delete(client.macaddr);
      f7.toast.show({
        text: `Unpinned`,
        closeTimeout: 2000,
      });
    } else {
      pinnedClientsStore.add(client);
      f7.toast.show({
        text: `Pinned`,
        closeTimeout: 2000,
      });
    }
  }

  function loadMore(done) {
    loadData().then(() => done());
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar
    title={client.name
      ? client.name
      : client.macaddr + pinnedState
      ? " - (P)"
      : ""}
    backLink="Back"
  >
    <NavRight>
      <Link
        iconIos={pinnedState ? "f7:pin_slash" : "f7:pin"}
        iconAurora={pinnedState ? "f7:pin_slash" : "f7:pin"}
        iconMd="material:push_pin"
        tooltip="Pin"
        on:click={pinClient}
        title="Test"
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
          iconIos="f7:off"
          iconAurora="f7:off"
          iconMd="material:power_settings_new"
          tooltip="Disconnect Client"
          text="Disconnect"
          on:click={disconnectClient}
        />
      </Col>
    </Row>
  </Block>

  {#each Object.entries(client.client_type == "WIRED" ? handledEntriesWired : handledEntriesWireless) as [title, data]}
    <BlockTitle>{title}</BlockTitle>
    <List class="search-list">
      {#each Object.entries(data) as [key, description]}
        {#if typeof description === "object"}
          <ListItem
            class={loadClass}
            title={description.title}
            after={`${client[key]} ${description.unit}`}
          />
        {:else}
          <ListItem class={loadClass} title={description} after={client[key]} />
        {/if}
      {/each}
    </List>
  {/each}
</Page>
