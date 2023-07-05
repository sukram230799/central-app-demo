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
  } from "framework7-svelte";
  import { onDestroy, onMount } from "svelte";

  import { central } from "../js/central";
  import { errorToast } from "../js/operations/error-toast";

  let subscriptions = [];
  import { pinnedClientsStore } from "../js/svelte-store";

  let loaded = false;
  let clients = [];
  let clientsTotal = 0;
  let pinnedClients = [];

  export let filters = {};

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        pinnedClientsStore.subscribe((pinnedClientsResult) => {
          pinnedClients = Object.values(pinnedClientsResult);
        })
      );

      // Load all clients
      loadData();
    })
  );

  onDestroy(() => {
    pinnedClients = [];
    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
  });

  async function loadDataSwitcher() {
    if (
      filters &&
      Object.keys(filters).length === 0 &&
      Object.getPrototypeOf(filters) === Object.filters
    ) {
      return await central.listUnifiedClientsFiltered({
        ...filters,
      });
    }
    return await central.listUnifiedClientsAutoFiltered();
  }

  async function loadData() {
    try {
      const clientList = await loadDataSwitcher();
      console.log(clientList);
      clientsTotal = clientList.total;
      clients = clientList.clients;
    } catch (e) {
      errorToast(f7, e);
    } finally {
      loaded = true;
    }
  }

  function getClientIcon(client) {
    if (client?.os_type?.toLowerCase().includes("android"))
      return {
        ios: "f7:logo_android",
        aurora: "f7:logo_android",
        md: "material:android",
      };
    else if (client?.os_type?.toLowerCase().includes("ios"))
      return {
        ios: "f7:logo_ios",
        aurora: "f7:logo_ios",
        md: "f7:logo_ios",
      };
    else if (client?.os_type?.toLowerCase().includes("windows"))
      return {
        ios: "f7:logo_windows",
        aurora: "f7:logo_windows",
        md: "f7:logo_windows",
      };
    else if (client?.os_type?.toLowerCase().includes("macos"))
      return {
        ios: "f7:logo_macos",
        aurora: "f7:logo_macos",
        md: "f7:logo_macos",
      };
    else if (client?.os_type?.toLowerCase().includes("google"))
      return {
        ios: "f7:logo_google",
        aurora: "f7:logo_google",
        md: "f7:logo_google",
      };
    else if (client.client_type === "WIRELESS")
      return {
        ios: "f7:wifi",
        aurora: "f7:wifi",
        md: "material:wifi",
      };
    else
      return {
        ios: "material:cable",
        aurora: "material:cable",
        md: "material:cable",
      };
  }

  function getClientType(client) {
    return client.client_type;
  }

  function loadMore(done) {
    loadData().then(() => done());
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar title="Clients" backLink="Back">
    <NavRight>
      <!---->
      <Link
        iconIos="f7:line_horizontal_3_decrease"
        iconAurora="f7:line_horizontal_3_decrease"
        iconMd="material:filter_list"
        panelOpen="right"
      />
      <Link
        searchbarEnable=".searchbar-client"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
        disabled={!clients?.length}
      />
    </NavRight>
    <Searchbar
      class="searchbar-client"
      expandable
      searchContainer=".search-list"
      searchIn=".item-title"
      disableButton={!theme.aurora}
    />
  </Navbar>
  {#if pinnedClients.length}
    <BlockTitle>Pinned Clients</BlockTitle>
    <List class="pinned-list">
      {#each pinnedClients as pinnedClient}
        <ListItem
          footer={`${pinnedClient.macaddr} – ${pinnedClient.ip_address}`}
          title={pinnedClient.name ? pinnedClient.name : pinnedClient.macaddr}
          href="/clients/details/"
          routeProps={{
            client: clients?.filter(
              (client) => client.macaddr === pinnedClient.macaddr
            ).length
              ? clients?.filter(
                  (client) => client.macaddr === pinnedClient.macaddr
                )[0]
              : { ...pinnedClient, partial: true },
            icons: pinnedClient.icons,
            clientType: getClientType(pinnedClient),
            clientMAC: pinnedClient.macaddr,
          }}
        >
          <Icon
            slot="after"
            ios={pinnedClient?.icons?.ios ? pinnedClient.icons.ios : "f7:pin"}
            aurora={pinnedClient?.icons?.aurora
              ? pinnedClient.icons.aurora
              : "f7:pin"}
            md={pinnedClient?.icons?.md
              ? pinnedClient.icons.md
              : "material:push_pin"}
          />
        </ListItem>
      {/each}
    </List>
  {/if}
  {#if loaded}
    <BlockTitle>Clients (Total: {clientsTotal})</BlockTitle>
  {:else}
    <BlockTitle>Clients</BlockTitle>
  {/if}
  <List class="search-list">
    {#if !loaded}
      {#each [{ ios: "f7:logo_android", aurora: "f7:logo_android", md: "material:android" }, { ios: "f7:logo_ios", aurora: "f7:logo_ios", md: "f7:logo_ios" }, { ios: "f7:logo_windows", aurora: "f7:logo_windows", md: "f7:logo_windows" }, { ios: "f7:logo_macos", aurora: "f7:logo_macos", md: "f7:logo_macos" }, { ios: "f7:logo_google", aurora: "f7:logo_google", md: "f7:logo_google" }, { ios: "f7:wifi", aurora: "f7:wifi", md: "material:wifi" }, { ios: "material:cable", aurora: "material:cable", md: "material:cable" }].sort((a, b) => 0.5 - Math.random()) as icons}
        <ListItem
          class={theme.ios
            ? "skeleton-text skeleton-effect-pulse"
            : "skeleton-text skeleton-effect-wave"}
          footer="00:00:00:00:00:00 - 192.168.10.100"
          title="Name of Device"
          header="CN20304050 - Access Point - Role"
          href="#"
        >
          <Icon ios={icons.ios} aurora={icons.aurora} md={icons.md} />
        </ListItem>
      {/each}
    {/if}
    {#each clients as client}
      <ListItem
        footer={`${client.macaddr} – ${client.ip_address}`}
        title={client.name ? client.name : client.macaddr}
        header={`${client.associated_device} – ${client.associated_device_name} – ${client.user_role}`}
        href="/clients/details/"
        routeProps={{
          clientMAC: client.macaddr,
          client: client,
          icons: getClientIcon(client),
          clientType: getClientType(client),
        }}
      >
        <Icon
          slot="after"
          ios={getClientIcon(client).ios}
          aurora={getClientIcon(client).aurora}
          md={getClientIcon(client).md}
        />
      </ListItem>
    {/each}
    {#if loaded && !clients?.length}
      <ListItem>No entries</ListItem>
    {/if}
  </List>
</Page>
