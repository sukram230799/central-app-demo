<script>
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
  import { Central } from "../js/central";
  import { groupStore } from "../js/svelte-store";

  let groups = [];
  groupStore.subscribe((groupEntries) => {
    groups = groupEntries;
  });

  const central = new Central();

  async function loadData(showProgressbar) {
    if (showProgressbar) f7.progressbar.show("red");
    await central.ready();
      const groupsResponse = await central.listGroups();
    if (showProgressbar) f7.progressbar.hide();
  }

  loadData(true);

  function loadMore(done) {
    loadData(false).then(() => done());
  }
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
  <List class="search-groups-overview-list">
    {#each groups as group}
      <ListItem
        title={group}
        href="/groups/details/"
        routeProps={{ groupName: group }}
      />
    {/each}
  </List>
</Page>
