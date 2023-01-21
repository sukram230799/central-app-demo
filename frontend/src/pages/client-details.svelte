<script>
  import {
    theme,
    f7,
    f7ready,
    App,
    Panel,
    Views,
    View,
    Popup,
    Page,
    Navbar,
    Toolbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    LoginScreen,
    LoginScreenTitle,
    List,
    ListItem,
    ListInput,
    ListButton,
    BlockFooter,
    Searchbar,
  } from "framework7-svelte";
  import { central } from "../js/central";

  export let client;

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
</script>

<Page>
  <Navbar title="Client Details" backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:lightbulb"
        iconAurora="f7:lightbulb"
        iconMd="material:lightbulb"
        on:click={blinkLED}
        tooltip="Blink LED"
      />
      <Link
        iconIos="f7:off"
        iconAurora="f7:off"
        iconMd="material:power_settings_new"
        tooltip="Disconnect Client"
        on:click={disconnectClient}
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

  {#each Object.entries(client.client_type == "WIRED" ? handledEntriesWired : handledEntriesWireless) as [title, data]}
    <BlockTitle>{title}</BlockTitle>
    <List class="search-list">
      {#each Object.entries(data) as [key, description]}
        {#if typeof description === "object"}
          <ListItem
            title={description.title}
            after={`${client[key]} ${description.unit}`}
          />
        {:else}
          <ListItem title={description} after={client[key]} />
        {/if}
      {/each}
    </List>
  {/each}

  <!-- <BlockTitle>Client Info</BlockTitle>
    <List>
        <ListItem title="Name" after={client.name} />
        <ListItem title="IP" after={client.ip_address} />
        <ListItem title="MAC" after={client.macaddr} />
        <ListItem title="OS Type" after={client.os_type} />
        <ListItem title="Manufacturer" after={client.manufacturer} />
    </List> -->
  <!-- <BlockTitle>Wireless Info</BlockTitle>
    <List>
        <ListItem title="Network" after={client.network} />
        <ListItem title="Connection" after={client.connection} />
        <ListItem title="Encryption" after={client.encryption_method} />
        <ListItem title="Channel" after={client.channel} />
        <ListItem title="Band" after={client.band} />
        <ListItem title="Signal dB" after={client.signal_db} />
        <ListItem title="Signal Strength" after={client.signal_strength} />
        <ListItem title="SNR" after={client.snr} />
        <ListItem title="Speed" after={client.speed} />
    </List> -->
  <!-- <BlockTitle>Role</BlockTitle>
    <List>
        <ListItem title="User Role" after={client.user_role} />
        <ListItem title="Username" after={client.username} />
        <ListItem title="VLAN" after={client.vlan} />
    </List> -->
  <!-- <BlockTitle>Device Info</BlockTitle>
    <List>
        <ListItem title="Type" after={client.connected_device_type} />
        <ListItem title="Device" after={client.associated_device} />
        <ListItem title="MAC" after={client.associated_device_mac} />
        <ListItem title="Name" after={client.associated_device_name} />
        <ListItem title="Group" after={client.group_name} />
        <ListItem title="Radio MAC" after={client.radio_mac} />
        <ListItem title="Radio Number" after={client.radio_number} />
    </List> -->
  <!-- <BlockTitle>All Info</BlockTitle>
    <List>
        {#each Object.entries(client) as [title, data]}
            <ListItem {title} after={data} />
        {/each}
    </List> -->
</Page>
