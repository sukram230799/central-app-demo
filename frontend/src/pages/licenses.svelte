<script>
  import {
    theme,
    Page,
    Navbar,
    Link,
    Searchbar,
    List,
    ListItem,
    NavRight,
    BlockTitle,
  } from "framework7-svelte";

  import licenses from "../licenses.json";
</script>

<Page>
  <Navbar title="Licenses" backLink="Back">
    <NavRight>
      <Link
        searchbarEnable=".searchbar-license"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
      />
    </NavRight>
    <Searchbar
      class="searchbar-license"
      expandable
      searchContainer=".license-list"
      searchIn=".item-title, .item-after"
      disableButton={!theme.aurora}
    />
  </Navbar>
  <BlockTitle>NPM Packages</BlockTitle>
  <List mediaList class="license-list">
    {#each Object.entries(licenses) as [name, license]}
      <ListItem
        title={name}
        after={license.licenses}
        href={license.repository}
        external
      />
    {/each}
  </List>
</Page>
