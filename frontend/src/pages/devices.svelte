<script>
  import {
    f7,
    f7ready,
    theme,
    Page,
    Navbar,
    NavRight,
    Link,
    BlockTitle,
    List,
    ListItem,
    Icon,
    Searchbar,
    SwipeoutActions,
    SwipeoutButton,
    Actions,
    ActionsGroup,
    ActionsButton,
    ActionsLabel,
  } from "framework7-svelte";
  import { onMount, onDestroy } from "svelte";

  import { central } from "../js/central";

  let subscriptions = [];
  import { groupStore, selectedFilterStore } from "../js/svelte-store";

  let loaded = false;
  let devices = [];

  let filters = {};

  let checkbox = false;
  let moveActionsOpen = false;
  let selectedDevices = [];

  let groups = [];

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        groupStore.subscribe((groupsList) => (groups = groupsList)),
        selectedFilterStore.subscribe(
          (selectedFilters) => (filters = filterTranslator(selectedFilters))
        )
      );

      loadData();
    })
  );

  onDestroy(() => {
    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
  });

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
    const deviceType = getDeivceType(device);
    if (deviceType === "SWITCH")
      return {
        ios: "material:cable",
        aurora: "material:cable",
        md: "material:cable",
      };
    else if (deviceType === "IAP")
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

  function getDeivceType(device) {
    if (device?.switch_type) return "SWITCH";
    else if (device?.ap_deployment_mode) return "IAP";
    else return "CONTROLLER";
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
              closeTimeout: 2000,
            });
          })
          .finally(() => {
            loadData();
            f7.preloader.hide();
          });
      }
    );
  }

  function loadMore(done) {
    loadData().then(() => done());
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar title="Devices" backLink="Back"
    ><NavRight>
      <!---->
      <Link
        iconIos="f7:folder_badge_plus"
        iconAurora="f7:folder_badge_plus"
        iconMd="icon:mdi mdi-folder-arrow-left-right-outline"
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
        routeProps={{
          device: device,
          deviceType: getDeivceType(device),
          deviceSerial: device.serial,
        }}
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
