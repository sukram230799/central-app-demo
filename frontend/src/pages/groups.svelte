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
    SwipeoutActions,
    SwipeoutButton,
  } from "framework7-svelte";
  import { central } from "../js/central";
  import { groupStore } from "../js/svelte-store";
  import GroupPropertiesBubbles from "../components/group-properties-bubbles.svelte";
  import GroupTemplateBubbles from "../components/group-template-bubbles.svelte";
  import {
    cloneGroupGetName,
    deleteGroupDialog,
  } from "../js/operations/group-operations";

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
    const groups = groupsResponse.groups;
    await Promise.all([loadTemplateInfo(groups), loadGroupProperties(groups)]);
    detailsLoaded = true;
    if (showProgressbar) f7.progressbar.hide();
  }

  async function loadTemplateInfo(groups) {
    groupsTemplateInfoResult = await central.getGroupTemplateInfo({
      groups,
    });
    groupsTemplateInfo = groupsTemplateInfoResult.data.reduce((accu, value) => {
      accu[value.group] = value.template_details;
      return accu;
    }, []);
  }

  async function loadGroupProperties(groups) {
    groupsPropertiesResult = await central.getPropertiesOfGroups({
      groups,
    });
    groupsProperties = groupsPropertiesResult.data.reduce((accu, value) => {
      accu[value.group] = value.properties;
      return accu;
    }, []);
  }

  loadData(true);

  function loadMore(done) {
    loadData(false).then(() => done());
  }

  function cloneGroup() {
    const groupName = this.$$scope.ctx.slice(-1)[0];
    console.log("clone", groupName);
    cloneGroupGetName(f7, groupCloned, groupName);
  }

  function groupCloned(isCloned, groupName) {
    if (isCloned) {
      groupStore.add(groupName);
      loadData(true);
    }
    f7.swipeout.close(".swipeout");
  }

  function deleteGroup() {
    console.log(this);
    const groupName = this.$$scope.ctx.slice(-1)[0];
    console.log("delete", groupName);
    deleteGroupDialog(f7, groupDelted, groupName);
  }

  function groupDelted(isDeleted, groupName) {
    if (isDeleted) {
      groupStore.delete(groupName);
    loadData(true);
    }
    f7.swipeout.close(".swipeout");
  }

  onDestroy(() => f7.progressbar.hide());
</script>

<Page ptr onPtrRefresh={loadMore}>
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
      {#if detailsLoaded}
        <ListItem
          swipeout={false}
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
          <!--
          <SwipeoutActions left>
            <SwipeoutButton overswipe color="red" onClick={deleteGroup}
              >Delete</SwipeoutButton
            >
            <SwipeoutButton color="orange" onClick={cloneGroup}
              >Clone</SwipeoutButton
            >
          </SwipeoutActions>
          -->
          <svelte:fragment slot="subtitle">
            <GroupTemplateBubbles
              groupTemplateInfo={groupsTemplateInfo[group]}
            />
          </svelte:fragment>
          <svelte:fragment slot="text">
            <GroupPropertiesBubbles groupProperties={groupsProperties[group]} />
          </svelte:fragment>
        </ListItem>
      {:else}
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
      {/if}
    {/each}
  </List>
</Page>
