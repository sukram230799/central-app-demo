<script>
  import { onDestroy, onMount } from "svelte";

  import {
    f7,
    f7ready,
    theme,
    Chip,
    Panel,
    View,
    Page,
    Navbar,
    Range,
    Block,
    BlockTitle,
    List,
    ListItem,
    ListInput,
  } from "framework7-svelte";

  import {
    selectedFilterStore,
    selectedFilterDefaults,
    selectedFilterNames,
    selectedSortingOrderStore,
    timeRanges,
    groupStore,
    labelStore,
    siteStore,
    groupCacheStore,
    labelCacheStore,
    siteCacheStore,
    currentAccountIdStore,
  } from "../js/svelte-store";

  import { central } from "../js/central";

  function deleteFilterChipConfirm(e) {
    const target = e.target;
    f7.dialog.confirm(
      "Sets the filter to it's default value.",
      "Remove Filter?",
      () => {
        const filterId = f7
          .$(target)
          .parents(".chip")[0]
          .getAttribute("data-filter-id");
        deleteFilterChip(filterId);
      }
    );
  }
  function deleteFilterChipNoConfirm(e) {
    const target = e.target;
    const filterId = f7
      .$(target)
      .parents(".chip")[0]
      .getAttribute("data-filter-id");
    deleteFilterChip(filterId);
  }

  function deleteFilterChip(filterId) {
    selectedFilterStore.update((value) => {
      value[filterId] = selectedFilterDefaults[filterId];
      return value;
    });
  }

  let currentAccountIdStoreUnsub;

  onMount(() => {
    f7ready(async () => {
      // Call F7 APIs here
      console.log("Await Central Ready");
      await central.ready();
      console.log("Central is ready. Load data");
      currentAccountIdStoreUnsub = currentAccountIdStore.subscribe(
        (accountId) => {
          const siteCacheStoreUnsub = siteCacheStore.subscribe((value) => {
            if (!value[accountId]?.time)
              central.listSites().finally(() => siteCacheStoreUnsub());
          });
          const labelCacheStoreUnsub = labelCacheStore.subscribe((value) => {
            if (!value[accountId]?.time)
              central.listLabels().finally(() => labelCacheStoreUnsub());
          });
          const groupCacheStoreUnsub = groupCacheStore.subscribe((value) => {
            if (!value[accountId]?.time)
              central.listGroups().finally(() => groupCacheStoreUnsub());
          });
        }
      );
    });
  });

  onDestroy(() => {
    currentAccountIdStoreUnsub();
  });

  const arrayIsEqual = (a, b) =>
    JSON.stringify(a.sort()) === JSON.stringify(b.sort());
</script>

<Panel right cover containerEl="#panel-page" id="device-filter-panel">
  <View>
    <Page>
      <Navbar title="Filter / Sort" />
      <BlockTitle>Sort</BlockTitle>
      <List>
        <ListItem
          title="Sort By"
          id="sortOrder"
          smartSelect
          smartSelectParams={{ openIn: "popover" }}
        >
          <select
            name="selectedSortingOrder"
            multiple
            bind:value={$selectedSortingOrderStore}
          >
            {#each Object.entries(selectedFilterNames) as [id, name]}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </ListItem>
      </List>
      <BlockTitle>Filter</BlockTitle>
      <Block noHairlines={true}>
        {#each Object.entries($selectedFilterStore) as [filterId, value]}
          <!--{#if value && !(Array.isArray(value) && !value.length) && !(filterId === "clientStatus" && value === "connected") && !(filterId === "clientType" && value === "both")}-->
          {#if value != selectedFilterDefaults[filterId] && !(Array.isArray(value) && arrayIsEqual(value, selectedFilterDefaults[filterId]))}
            <Chip
              text={selectedFilterNames[filterId]}
              deleteable
              onDelete={deleteFilterChipNoConfirm}
              data-filter-id={filterId}
            />
          {/if}
        {/each}
      </Block>
      <List>
        <ListInput
          label={selectedFilterNames.clientType}
          id="filterClientType"
          type="select"
          bind:value={$selectedFilterStore.clientType}
          placeholder="Please choose..."
        >
          <option value="both">Both</option>
          <option value="WIRED">Wired</option>
          <option value="WIRELESS">Wireless</option>
        </ListInput>
        <ListInput
          label={selectedFilterNames.group}
          id="filterGroup"
          type="select"
          bind:value={$selectedFilterStore.group}
          placeholder="Pease choose..."
        >
          {#each $groupStore as group}
            <option value={group}>{group}</option>
          {/each}
        </ListInput>
        <ListInput
          label={selectedFilterNames.label}
          id="filterLabel"
          type="select"
          bind:value={$selectedFilterStore.label}
          placeholder="Pease choose..."
        >
          {#each $labelStore as label}
            <option value={label.label_name}>{label.label_name}</option>
          {/each}
        </ListInput>
        <ListInput
          label={selectedFilterNames.site}
          id="filterSite"
          type="select"
          bind:value={$selectedFilterStore.site}
          placeholder="Pease choose..."
        >
          {#each $siteStore as site}
            <option value={site.site_name}>{site.site_name}</option>
          {/each}
        </ListInput>
        <ListInput input={false} label={selectedFilterNames.timeRange}>
          <!-- 3H = 3 Hours, 1D = 1 Day, 1W = 1 Week, 1M = 1Month, 3M = 3Months. -->
          <!-- ['3 Hours', '1 Day', '1 Week', '1 Month', '3 Months'] -->
          <!-- ['3H', '1D', '1W', '1M', '3M'] -->
          <span slot="input">
            <Range
              id="filterTimeRange"
              bind:value={$selectedFilterStore.timeRange}
              min={0}
              max={4}
              label={true}
              step={1}
              scale={!theme.ios}
              scaleSteps={4}
              formatLabel={(value) => timeRanges[value]}
              formatScaleLabel={(value) => timeRanges[value]}
            />
          </span>
        </ListInput>
        <ListInput
          label={selectedFilterNames.clientStatus}
          id="filterClientStatus"
          type="select"
          bind:value={$selectedFilterStore.clientStatus}
          placeholder="Please choose..."
        >
          <option value="CONNECTED">Connected</option>
          <option value="FAILED_TO_CONNECT">Faild to connect</option>
        </ListInput>
        <ListInput
          label={selectedFilterNames.network}
          id="filterNetworkName"
          type="text"
          bind:value={$selectedFilterStore.network}
          placeholder="CorporateWiFi"
        />
        <ListInput
          label={selectedFilterNames.serial}
          id="filterSerial"
          type="text"
          bind:value={$selectedFilterStore.serial}
          placeholder="CN102030"
        />
        <ListInput
          label={selectedFilterNames.swarmId}
          id="filterSwarmId"
          type="text"
          bind:value={$selectedFilterStore.swarmId}
          placeholder="Swarm Id"
        />
        <ListInput
          label={selectedFilterNames.clusterId}
          id="filterClusterId"
          type="text"
          bind:value={$selectedFilterStore.clusterId}
          placeholder="Mobility Controller Serial"
        />
        <ListInput
          label={selectedFilterNames.band}
          id="filterBand"
          type="select"
          bind:value={$selectedFilterStore.band}
          placeholder="Please choose..."
        >
          <option value="">All</option>
          <option value="2.4">2.4 GHz</option>
          <option value="5">5 GHz</option>
          <option value="6">6 GHz</option>
        </ListInput>
        <ListInput
          label={selectedFilterNames.stackId}
          id="filterStackId"
          type="text"
          bind:value={$selectedFilterStore.stackId}
          placeholder="Switch Stack Id"
        />
        <ListInput
          label={selectedFilterNames.osType}
          id="filterOSType"
          bind:value={$selectedFilterStore.osType}
          placeholder="Samsung Android"
        />
        <ListItem
          title={selectedFilterNames.field}
          id="filterField"
          smartSelect
          smartSelectParams={{ openIn: "popover" }}
        >
          <select name="field" multiple bind:value={$selectedFilterStore.field}>
            {#if !"wired"}
              <option value="name">Name</option>
              <option value="ip_address">IP Address</option>
              <option value="username">Username</option>
              <option value="associated_device">Associated Device</option>
              <option value="group_name">Group Name</option>
              <option value="interface_mac">Interface MAC</option>
              <option value="vlan">VLAN</option>
            {:else if "wireless"}<option value="name">Name</option>
              <option value="ip_address">IP Address</option>
              <option value="username">Username</option>
              <option value="os_type">OS Type</option>
              <option value="connection">Connection</option>
              <option value="associated_device">Associated Device</option>
              <option value="group_name">Group Name</option>
              <option value="swarm_id">Swark Id</option>
              <option value="network">Network</option>
              <option value="radio_mac">Radio MAC</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="vlan">VLAN</option>
              <option value="encryption_method">Encryption Method</option>
              <option value="radio_number">Radio Number</option>
              <option value="speed">Speed</option>
              <option value="usage">Usage</option>
              <option value="health">Health</option>
              <option value="labels">Labels</option>
              <option value="site">Site</option>
              <option value="signal_strength">Signal Strength</option>
              <option value="signal_db">Signal dB</option>
              <option value="snr">SNR</option>{/if}
          </select>
        </ListItem>
        <ListItem
          title={selectedFilterNames.additionalFields}
          id="filterShow"
          smartSelect
          smartSelectParams={{ openIn: "popover" }}
        >
          <select
            name="field"
            multiple
            bind:value={$selectedFilterStore.additionalFields}
          >
            <option value="usage">Usage</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="signal_db">Signal dB</option>
          </select>
        </ListItem>
        <!-- calculate_total = false, offset, limit, sort, last_client_mac, timerange = '3H', client_type = 'WIRELESS', client_status = "CONNECTED", show_usage, show_manufacturer, show_signal_db-->
      </List>
    </Page>
  </View>
</Panel>
