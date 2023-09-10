<script>
  import { onDestroy, onMount } from "svelte";

  import {
    f7,
    f7ready,
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
    SwipeoutActions,
    SwipeoutButton,
  } from "framework7-svelte";
  import GroupPropertiesBubbles from "../components/group-properties-bubbles.svelte";
  import GroupTemplateBubbles from "../components/group-template-bubbles.svelte";

  import { central } from "../js/central";

  let subscriptions = [];
  import { groupStore } from "../js/svelte-store";
  import {
    cloneGroupGetName,
    deleteGroupDialog,
  } from "../js/operations/group-operations";
  import { errorToast } from "../js/operations/error-toast";

  let groupsAvailable = [];
  let groupsLoaded = [];
  let detailsLoaded = false;
  let groupsTemplateInfoResult = {};
  let groupsTemplateInfo = {};
  let groupsPropertiesResult = {};
  let groupsProperties = {};

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        groupStore.subscribe((groupEntries) => {
          groupsAvailable = groupEntries;
        })
      );
      loadDataInitial(true);
    })
  );

  onDestroy(() => {
    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
    f7.progressbar.hide();
  });

  async function loadDataInitial(showProgressbar) {
    if (showProgressbar) f7.progressbar.show("red");

    showPreloader = true;
    allowInfite = true;

    await central.ready(1);
    const groupsResponse = await central.listGroups(); // Groups are added via subscription!
    groupsLoaded = [];
    await loadDetails(groupsResponse.groups.slice(0, 20));
  }

  async function loadDetails(groupsToLoad) {
    try {
      if (!groupsToLoad.length) return; // Skip empty updates
      await Promise.all([
        loadTemplateInfo(groupsToLoad),
        loadGroupProperties(groupsToLoad),
      ]);
      detailsLoaded = true;
    } catch (e) {
      errorToast(f7, e, { defaultTimeout: 2000 });
    } finally {
      groupsLoaded = [...groupsLoaded, ...groupsToLoad];
      f7.progressbar.hide();
    }
  }

  async function loadMoreDetails() {
    const groupsToLoad = groupsAvailable
      .filter((group) => !groupsLoaded.includes(group))
      .slice(0, 20);
    await loadDetails(groupsToLoad);
  }

  async function loadTemplateInfo(groupsToLoad) {
    groupsTemplateInfoResult = await central.getGroupTemplateInfo({
      groups: groupsToLoad,
    });
    groupsTemplateInfo = {
      ...groupsTemplateInfo,
      ...groupsTemplateInfoResult.data.reduce((accu, value) => {
        accu[value.group] = value.template_details;
        return accu;
      }, []),
    };
  }

  async function loadGroupProperties(groupsToLoad) {
    groupsPropertiesResult = await central.getPropertiesOfGroups({
      groups: groupsToLoad,
    });
    groupsProperties = {
      ...groupsProperties,
      ...groupsPropertiesResult.data.reduce((accu, value) => {
        accu[value.group] = value.properties;
        return accu;
      }, []),
    };
  }

  function cloneGroup(groupName) {
    console.log("clone", groupName);
    cloneGroupGetName(f7, groupCloned, groupName);
  }

  function groupCloned(isCloned, groupName) {
    if (isCloned) {
      groupStore.add(groupName);
      loadDataInitial(true);
    }
    f7.swipeout.close(".swipeout");
  }

  function deleteGroup(groupName) {
    console.log("delete", groupName);
    deleteGroupDialog(f7, groupDelted, groupName);
  }

  function groupDelted(isDeleted, groupName) {
    if (isDeleted) {
      groupStore.delete(groupName);
      loadDataInitial(true);
    }
    f7.swipeout.close(".swipeout");
  }

  function reload(done) {
    loadDataInitial(false).then(() => done());
  }

  let showPreloader = true;
  let allowInfite = true;

  async function infiniteLoad() {
    if (
      !detailsLoaded ||
      !allowInfite ||
      groupsAvailable.length === groupsLoaded.length
    )
      return;
    allowInfite = false;
    await loadMoreDetails();
    if (
      groupsAvailable.length > 0 &&
      groupsAvailable.length === groupsLoaded.length
    )
      showPreloader = false;
    allowInfite = true;
  }
</script>

<Page
  ptr
  onPtrRefresh={reload}
  infinite
  infiniteDistance={300}
  infinitePreloader={showPreloader && detailsLoaded}
  onInfinite={infiniteLoad}
>
  <Navbar title="Groups" backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:plus"
        iconAurora="f7:plus"
        iconMd="material:add"
        href="/groups/create/"
      />
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
    {#if !groupsAvailable.length}
      {#each Array.from(Array(20).keys()) as el}
        <ListItem
          class={theme.ios
            ? "skeleton-text skeleton-effect-pulse"
            : "skeleton-text skeleton-effect-wave"}
          title={`Group Name ${el}`}
          href="#"
        />
      {/each}
    {:else if !groupsLoaded.length}
      {#each groupsAvailable as group}
        <ListItem
          disabled={false && !detailsLoaded}
          title={group}
          href="/groups/details/"
          routeProps={{
            groupName: group,
            groupProperties: {},
            groupTemplateInfo: {},
          }}
        />
      {/each}
    {/if}
    {#each groupsLoaded as group}
      <ListItem
        swipeout
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
        <SwipeoutActions left>
          <SwipeoutButton
            overswipe
            color="red"
            onClick={() => deleteGroup(group)}>Delete</SwipeoutButton
          >
          <SwipeoutButton color="orange" onClick={() => cloneGroup(group)}
            >Clone</SwipeoutButton
          >
        </SwipeoutActions>
        <svelte:fragment slot="subtitle">
          <GroupTemplateBubbles groupTemplateInfo={groupsTemplateInfo[group]} />
        </svelte:fragment>
        <svelte:fragment slot="text">
          <GroupPropertiesBubbles groupProperties={groupsProperties[group]} />
        </svelte:fragment>
      </ListItem>
    {/each}
  </List>
</Page>
