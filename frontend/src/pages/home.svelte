<script>
  import {
    theme,
    Page,
    Navbar,
    NavLeft,
    NavTitle,
    NavTitleLarge,
    NavRight,
    Link,
    Toolbar,
    Searchbar,
    Block,
    BlockTitle,
    List,
    ListItem,
    Row,
    Col,
    Button,
  } from "framework7-svelte";
  import Icon from "framework7-svelte/components/icon.svelte";

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

  function onPageInit(event) {}
</script>

<Page name="home" {onPageInit}>
  <!-- Top Navbar -->
  <Navbar large sliding={false}>
    <NavLeft>
      <Link
        iconIos="f7:menu"
        iconAurora="f7:menu"
        iconMd="material:menu"
        panelOpen="left"
      />
    </NavLeft>
    <NavTitle sliding>Central Toolkit</NavTitle>
    <NavRight>
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
  <!-- Toolbar -->
  <!-- <Toolbar bottom>
    <Link>Left Link</Link>
    <Link>Right Link</Link>
  </Toolbar> -->
  <!-- Page content -->
  <Block strong>
    <p>Simple Central Client Demo Project.</p>
  </Block>

  <BlockTitle>Navigation</BlockTitle>
  <List>
    <ListItem link="/firmware/" title="Firmware" />
    <ListItem link="/clients/" title="Clients" />
    <ListItem link="/devices/" title="Devices" />
    <ListItem link="/settings/camera/" title="Camera Settings" />
    <ListItem link="/settings/central/" title="Central Settings" />
  </List>

  <!-- <BlockTitle>Modals</BlockTitle>
  <Block strong>
    <Row>
      <Col width="50">
        <Button fill raised popupOpen="#my-popup">Popup</Button>
      </Col>
      <Col width="50">
        <Button fill raised loginScreenOpen="#my-login-screen"
          >Login Screen</Button
        >
      </Col>
    </Row>
    <Row>
      <Col width="50">
        <Button fill raised onClick={console.log("Not implemented")}>---</Button
        >
      </Col>
      <Col width="50">
        <Button fill raised onClick={backgroundSync}>Background</Button>
      </Col>
    </Row>
  </Block>

  <BlockTitle>Panels</BlockTitle>
  <Block strong>
    <Row>
      <Col width="50">
        <Button fill raised panelOpen="left">Left Panel</Button>
      </Col>
      <Col width="50">
        <Button fill raised panelOpen="right">Right Panel</Button>
      </Col>
    </Row>
  </Block> -->

  <BlockTitle>Other</BlockTitle>
  <List>
    <ListItem link="/about/" title="About / Impressum" />
    <!-- <ListItem link="/form/" title="Form" /> -->
    <!--
    <ListItem
      title="Dynamic (Component) Route"
      link="/dynamic-route/blog/45/post/125/?foo=bar#about"
    />
    <ListItem
      title="Default Route (404)"
      link="/load-something-that-doesnt-exist/"
    />
    <ListItem
      title="Request Data & Load"
      link="/request-and-load/user/123456/"
    /> -->
  </List>
</Page>
