<script>
  import {
    theme,
    Page,
    Navbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    List,
    ListItem,
    Icon,
    Searchbar,
    SwipeoutActions,
    SwipeoutButton,
    f7,
    Actions,
    ActionsGroup,
    ActionsButton,
    ActionsLabel,
  } from "framework7-svelte";

  import { central } from "../js/central";
  import { groupStore, selectedFilterStore } from "../js/svelte-store";

  let devices = []; /* = [
    {
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
    },
    {
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
    },
  ];*/
  let filters = {};

  let checkbox = false;
  let moveActionsOpen = false;
  let selectedDevices = [];

  let groups;

  groupStore.subscribe((groupsList) => (groups = groupsList));

  selectedFilterStore.subscribe(
    (selectedFilters) => (filters = filterTranslator(selectedFilters))
  );

  function filterTranslator(allFilters) {
    return {
      group: allFilters.group,
      label: allFilters.label,
      site: allFilters.site,
    };
  }

  async function loadData() {
    await central.ready(3);
    const deviceLists = await Promise.all([
      central.listAccessPoints({ filters }),
      central.listGateways({ filters }),
      central.listSwitches({ filters }),
    ]);
    console.log(deviceLists);
    devices = [
      ...deviceLists[0].aps,
      ...deviceLists[1].gateways,
      ...deviceLists[2].switches,
    ];
  }

  function getDeviceIcon(device) {
    if (device?.switch_type)
      return {
        ios: "material:cable",
        aurora: "material:cable",
        md: "material:cable",
      };
    else if (device?.ap_deployment_mode)
      return {
        ios: "f7:wifi",
        aurora: "f7:wifi",
        md: "material:wifi",
      };
    else
      return {
        ios: "material:router",
        aurora: "material:router",
        md: "material:router",
      };
  }

  loadData();

  function loadMore(done) {
    loadData().then(() => done());
  }

  function onSelectedDeviceChange(serial) {
    if (selectedDevices.includes(serial))
      selectedDevices.splice(selectedDevices.indexOf(serial), 1);
    else selectedDevices.push(serial);
  }

  function moveDeviceClick(device) {
    f7.swipeout.close(".swipeout");
    selectedDevices = [device.serial];
    moveDeviceShowSelection();
  }

  function toggleCheckbox() {
    checkbox = !checkbox;
    if (checkbox)
      f7.toast.show({ text: "Select Devices to Move", closeTimeout: 2000 });
    else if (selectedDevices.length) moveDeviceShowSelection();
  }

  function moveDeviceShowSelection() {
    moveActionsOpen = true;
  }

  function moveActionsClick(group) {
    f7.dialog.confirm(
      `Move devices to group "${group}"`,
      "Move Devices?",
      () => {
        f7.preloader.show();
        central
          .moveDevicesToGroup({ serials: selectedDevices, group })
          .then((message) => {
            f7.toast.show({ text: message, closeTimeout: 2000 });
          })
          .catch((e) => {
            console.log(e);
            f7.toast.show({
              text: e?.options?.responseBody?.description
                ? e.options.responseBody.description
                : JSON.stringify(e),
              closeTimeout: 8000,
            });
          })
          .finally(() => {
            loadData();
            f7.preloader.hide();
          });
      }
    );
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar title="Devices" backLink="Back"
    ><NavRight>
      <!---->
      <Link
        iconIos="f7:folder"
        iconAurora="f7:folder"
        iconMd="icon:mdi mdi-folder"
        onClick={toggleCheckbox}
        tooltip="Move to Group"
      />
      <Link
        iconIos="f7:line_horizontal_3_decrease"
        iconAurora="f7:line_horizontal_3_decrease"
        iconMd="material:filter_list"
        panelOpen="right"
      />
      <Link
        searchbarEnable=".searchbar-device"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
        disabled={!devices.length}
      />
    </NavRight>
    <Searchbar
      class="searchbar-device"
      expandable
      searchContainer=".search-list"
      searchIn=".item-title"
      disableButton={!theme.aurora}
    />
  </Navbar>
  <Actions
    opened={moveActionsOpen}
    onActionsClosed={() => (moveActionsOpen = false)}
  >
    <ActionsGroup>
      <ActionsLabel>Move to Group</ActionsLabel>
      {#each groups as group}
        <ActionsButton onClick={() => moveActionsClick(group)}
          >{group}</ActionsButton
        >
      {/each}
    </ActionsGroup>
    <ActionsGroup>
      <ActionsButton color="red">Cancel</ActionsButton>
    </ActionsGroup>
  </Actions>
  <BlockTitle>Devices</BlockTitle>
  <List class="search-list">
    {#if !devices.length}
      {#each [{ ios: "material:cable", aurora: "material:cable", md: "material:cable" }, { ios: "material:cable", aurora: "material:cable", md: "material:cable" }, { ios: "f7:wifi", aurora: "f7:wifi", md: "material:wifi" }, { ios: "f7:wifi", aurora: "f7:wifi", md: "material:wifi" }, { ios: "material:router", aurora: "material:router", md: "material:router" }, { ios: "material:router", aurora: "material:router", md: "material:router" }].sort((a, b) => 0.5 - Math.random()) as icon}
        <ListItem
          class={theme.ios
            ? "skeleton-text skeleton-effect-pulse"
            : "skeleton-text skeleton-effect-wave"}
          footer="00:00:00:00:00:00 - 192.168.10.100"
          title="Name of Device"
          header="CN20304050 - Access Point"
          href="#"
        >
          <!-- <i slot="media" class="icon demo-list-icon" /> -->
          <!-- logo_windows logo_android logo_ios logo_macos logo_google-->
          {#if true}
            <Icon
              slot="media"
              ios={icon.ios}
              aurora={icon.aurora}
              md={icon.md}
            />
          {/if}
        </ListItem>
      {/each}
    {/if}
    {#each devices as device}
      <ListItem
        {checkbox}
        checked={selectedDevices.includes(device.serial)}
        onChange={() => onSelectedDeviceChange(device.serial)}
        swipeout={!checkbox}
        header={`${device.group_name}`}
        title={device.name ? device.name : device.macaddr}
        footer={`${device.serial} – ${device.macaddr}`}
        href={checkbox ? false : "/devices/details/"}
        routeProps={{ device: device }}
      >
        <Icon
          slot="after"
          ios={getDeviceIcon(device).ios}
          aurora={getDeviceIcon(device).aurora}
          md={getDeviceIcon(device).md}
        />
        {#if !checkbox}
          <SwipeoutActions>
            <SwipeoutButton
              color="orange"
              onClick={() => moveDeviceClick(device)}>Move</SwipeoutButton
            >
          </SwipeoutActions>
        {/if}
      </ListItem>
    {/each}
  </List>
</Page>
