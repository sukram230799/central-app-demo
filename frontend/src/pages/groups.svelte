<script>
  import { onDestroy } from "svelte";

  import {
    f7,
    theme,
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    List,
    Link,
    NavRight,
    Searchbar,
    ListItem,
  } from "framework7-svelte";
  import { central } from "../js/central";
  import { groupStore } from "../js/svelte-store";

  let groups = [];
  let detailsLoaded = false;
  let groupsTemplateInfoResult = {};
  let groupsTemplateInfo = {};
  let groupsPropertiesResult = {};
  let groupsProperties = {};

  groupStore.subscribe((groupEntries) => {
    groups = groupEntries;
  });

  async function loadData(showProgressbar) {
    if (showProgressbar) f7.progressbar.show("red");
    await central.ready(1);
    const groupsResponse = await central.listGroups(); // Groups are added via subscription!
    // TODO: Can be parallelized
    groupsTemplateInfoResult = await central.getGroupTemplateInfo(
      groupsResponse.groups
    );
    groupsPropertiesResult = await central.getPropertiesOfGroups({
      groups,
    });
    groupsTemplateInfo = groupsTemplateInfoResult.data.reduce((accu, value) => {
      accu[value.group] = value.template_details;
      return accu;
    }, []);
    groupsProperties = groupsPropertiesResult.data.reduce((accu, value) => {
      accu[value.group] = value.properties;
      return accu;
    }, []);
    detailsLoaded = true;
    if (showProgressbar) f7.progressbar.hide();
  }

  loadData(true);

  function loadMore(done) {
    loadData(false).then(() => done());
  }

  onDestroy(() => f7.progressbar.hide());
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar title="Groups" backLink="Back">
    <NavRight>
      <Link
        searchbarEnable=".searchbar-groups-overview"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
      />
    </NavRight>
    <Searchbar
      class="searchbar-groups-overview"
      expandable
      searchContainer=".search-groups-overview-list"
      searchIn=".item-title"
      disableButton={!theme.aurora}
    />
  </Navbar>
  <BlockTitle>Groups</BlockTitle>
  <List class="search-groups-overview-list" mediaList>
    {#if !groups.length}
      {#each Array.from(Array(20).keys()) as el}
        <ListItem
          class={theme.ios
            ? "skeleton-text skeleton-effect-pulse"
            : "skeleton-text skeleton-effect-wave"}
          title={`Group Name ${el}`}
          href="#"
        />
      {/each}
    {/if}
    {#each groups as group}
      <ListItem
        disabled={false && !detailsLoaded}
        title={group}
        href="/groups/details/"
        routeProps={{
          groupName: group,
          groupProperties:
            groupsProperties && groupsProperties[group]
              ? groupsProperties[group]
              : {},
          groupTemplateInfo:
            groupsTemplateInfo && groupsTemplateInfo[group]
              ? groupsTemplateInfo[group]
              : {},
        }}
      >
        <svelte:fragment slot="subtitle">
          Wired: {#if groupsTemplateInfo[group]?.Wired}
            <span class="badge color-gray">Template</span>
          {:else}
            <span class="badge color-orange">UI Group</span>
          {/if} Wireless: {#if groupsTemplateInfo[group]?.Wireless}
            <span class="badge color-gray">Template</span>
          {:else}
            <span class="badge color-orange">UI Group</span>
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="text">
          <span />
          <!-- AOS8 or AOS10-->
          {#if groupsProperties[group]?.AOSVersion === "AOS_8X"}
            <span class="badge color-teal">AOS8</span>
          {:else if groupsProperties[group]?.AOSVersion === "AOS_10X"}
            <span class="badge color-orange">AOS10</span>
            <!-- AP Type -->
            {#if groupsProperties[group]?.APNetworkRole === "Standard"}
              <span class="badge color-gray">Campus AP</span>
            {:else if groupsProperties[group]?.APNetworkRole === "Microbranch"}
              <span class="badge color-gray">Campus AP</span>
            {/if}
          {/if}
          <!--  Switch Type -->
          {#if groupsProperties[group]?.AllowedSwitchTypes.includes("AOS_CX")}
            <span class="badge color-gray">AOS-CX</span>
          {/if}
          {#if groupsProperties[group]?.AllowedSwitchTypes.includes("AOS_S")}
            <span class="badge color-gray">AOS-S</span>
          {/if}
          {#if groupsProperties[group]?.MonitorOnlySwitch}
            <span class="badge color-gray">Monitor-Only</span>
          {/if}
          <!-- Gateway Type -->
          {#if groupsProperties[group]?.GWNetworkRole === "BranchGateway"}
            <span class="badge color-gray">Branch Gateway</span>
          {:else if groupsProperties[group]?.GWNetworkRole === "WLANGateway"}
            <span class="badge color-gray">Mobility Gateway</span>
          {:else if groupsProperties[group]?.GWNetworkRole === "VPNConcentrator"}
            <span class="badge color-gray">VPNC</span>
          {/if}
        </svelte:fragment>
      </ListItem>
    {/each}
  </List>
</Page>
