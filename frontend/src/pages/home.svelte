<script>
  import {
    f7ready,
    theme,
    AccordionContent,
    Page,
    Popup,
    Navbar,
    NavTitle,
    NavTitleLarge,
    NavRight,
    Link,
    Searchbar,
    Block,
    BlockTitle,
    List,
    ListItem,
    Icon,
  } from "framework7-svelte";
  import { getDevice } from "framework7";
  import { onDestroy, onMount } from "svelte";
  import { central } from "../js/central";

  let subscriptions = [];
  import { newUserStore } from "../js/svelte-store";

  let centralReady = false;
  let welcomePopupOpen = false;

  async function backgroundSync() {
    const status = await navigator.permissions.query({
      name: "periodic-background-sync",
    });
    if (status.state === "granted") {
      // Periodic background sync can be used.
      console.log("Periodic background sync can be used.");
      const registration = await navigator.serviceWorker.ready;
      if ("periodicSync" in registration) {
        try {
          await registration.periodicSync.register("api-key-renewal", {
            // An interval of one day.
            minInterval: 24 * 60 * 60 * 1000,
          });
        } catch (error) {
          // Periodic background sync cannot be used.
        }
      }
    } else {
      // Periodic background sync cannot be used.
      console.log("Periodic background sync cannot be used.");
    }
  }

  function onWelcomePopupOpen() {}

  let device;

  onMount(() =>
    f7ready(() => {
      device = getDevice();
      subscriptions.push(
        newUserStore.subscribe((newUser) => {
          if (newUser) welcomePopupOpen = true;
        })
      );

      central.ready().then(() => (centralReady = true));
    })
  );

  onDestroy(() => {
    subscriptions.forEach((subscription) => {
      subscription();
    });
    subscriptions = [];
  });
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar large sliding={false}>
    <NavTitle sliding>Central Toolkit</NavTitle>
    <NavRight>
      <Link
        iconIos="f7:line_horizontal_3_decrease"
        iconAurora="f7:line_horizontal_3_decrease"
        iconMd="material:filter_list"
        panelOpen="right"
      />
      <Link
        searchbarEnable=".searchbar-demo"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
      />
    </NavRight>
    <Searchbar
      class="searchbar-demo"
      expandable
      searchContainer=".search-list"
      searchIn=".item-title"
      disableButton={!theme.aurora}
    />
    <NavTitleLarge>Central Toolkit</NavTitleLarge>
  </Navbar>

  <Popup
    swipeToClose={true}
    class="popup-welcome"
    opened={!centralReady && welcomePopupOpen}
    onPopupOpen={onWelcomePopupOpen}
    onPopupClosed={() => {
      newUserStore.set(false);
      welcomePopupOpen = false;
    }}
  >
    <Page>
      <Navbar title="Central Toolkit">
        <NavRight>
          <Link popupClose>Let's go</Link>
        </NavRight>
      </Navbar>

      <div>
        <div style="padding-left: 1em; padding-right: 1em; text-align: center;">
          <BlockTitle medium>Welcome!</BlockTitle>
          <img style="width: 50%;" src="/full-icon.svg" alt="icon" />
        </div>
      </div>
      <BlockTitle>Easy Setup</BlockTitle>
      <Block
        >This app needs your Central Credentials to access the details. All
        credentials are saved locally on the device.<br />
        You can enter the Credentials either manually or head to
        {#if device?.desktop}
          <Link href="https://central.wuest.dev/onboard" external
            >https://central.wuest.dev/onboard</Link
          >
        {:else}
          <a
            href="#"
            on:click={() =>
              navigator.clipboard.writeText(
                "https://central.wuest.dev/onboard"
              )}>https://central.wuest.dev/onboard</a
          >
        {/if} on a desktop and then scan the QR Code in the Central Settings.</Block
      >
      <BlockTitle>Install as App</BlockTitle>
      <List accordionList>
        <ListItem accordionItem title="Android" opened={theme.md}>
          <AccordionContent>
            <Block>
              On Android you should see an "Add Central Toolkit to Home Screen".
              Click on it to install the App.
            </Block>
          </AccordionContent>
        </ListItem>
        <ListItem accordionItem title="iOS" opened={theme.ios}>
          <AccordionContent>
            <Block
              >On iOS you can go to <Icon
                f7="square_arrow_up"
                size="14"
                color="black"
              /> Share -> "Add to Home Screen" to install the App.</Block
            >
          </AccordionContent>
        </ListItem>
      </List>
    </Page>
  </Popup>

  <Block strong>
    <p>Simple Central Client Demo Project.</p>
  </Block>

  {#if centralReady}
    <BlockTitle>Navigation</BlockTitle>
    <List>
      <!-- <ListItem link="/firmware/" title="Firmware" /> -->
      <ListItem link="/clients/" title="Clients" />
      <ListItem link="/devices/" title="Devices" />
      <ListItem link="/groups/" title="Groups" />
      <ListItem
        disabled={!centralReady}
        link="/troubleshooting/"
        title="Troubleshooting"
      />
    </List>
  {/if}

  <BlockTitle>Settings</BlockTitle>
  <List>
    <ListItem link="/settings/camera/" title="Camera Settings" />
    <ListItem link="/settings/central/" title="Central Settings" />
  </List>

  <BlockTitle>Other</BlockTitle>
  <List>
    <ListItem link="/license/" title="Licenses" />
    <ListItem link="/about/" title="About / Impressum" />
  </List>
</Page>
