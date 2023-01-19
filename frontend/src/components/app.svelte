<script>
  import { onMount } from "svelte";

  import {
    f7,
    f7ready,
    App,
    Panel,
    Views,
    View,
    Popup,
    Page,
    Navbar,
    Range,
    Toolbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    BlockHeader,
    LoginScreen,
    LoginScreenTitle,
    List,
    ListItem,
    ListInput,
    ListButton,
    BlockFooter,
    theme,
  } from "framework7-svelte";

  import routes from "../js/routes";
  import store from "../js/store";

  // Framework7 Parameters
  let f7params = {
    name: "Central Toolkit", // App name
    theme: "auto", // Automatic theme detection
    // theme: "ios",
    // theme: f7.desktop ? 'aurora' : 'auto',

    // App store
    store: store,
    // App routes
    routes: routes,
    // Register service worker (only on production build)
    serviceWorker:
      process.env.NODE_ENV === "production"
        ? {
            path: "/service-worker.js",
          }
        : {},
  };
  // Login screen demo data
  let username = "";
  let password = "";

  function alertLoginData() {
    f7.dialog.alert(
      "Username: " + username + "<br>Password: " + password,
      () => {
        f7.loginScreen.close();
      }
    );
  }
  onMount(() => {
    f7ready(() => {
      // Call F7 APIs here
    });
  });
</script>

<App {...f7params}>
  <!-- Left panel with cover effect-->
  <Panel left cover>
    <View>
      <Page>
        <Navbar title="Left Panel" />
        <Block>Left panel content goes here</Block>
      </Page>
    </View>
  </Panel>

  <!-- Right panel with reveal effect-->
  <Panel right cover>
    <View>
      <Page>
        <Navbar title="Filter / Sort" />
        <BlockTitle>Sort</BlockTitle>

        
        <BlockTitle>Filter</BlockTitle>
        <List>
          <ListInput input={false} label="Time Range">
            <!-- 3H = 3 Hours, 1D = 1 Day, 1W = 1 Week, 1M = 1Month, 3M = 3Months. -->
            <!-- ['3 Hours', '1 Day', '1 Week', '1 Month', '3 Months'] -->
            <!-- ['3H', '1D', '1W', '1M', '3M'] -->
            <span slot="input">
              <Range
                id="timeRange"
                min={0}
                max={4}
                label={true}
                step={1}
                scale={!theme.ios}
                scaleSteps={4}
                formatLabel={(value) => ["3H", "1D", "1W", "1M", "3M"][value]}
                formatScaleLabel={(value) =>
                  ["3H", "1D", "1W", "1M", "3M"][value]}
              />
            </span>
          </ListInput>
          <ListInput
            label="Client Type"
            id="clientType"
            type="select"
            value="both"
            placeholder="Please choose..."
          >
            <option value="both">Both</option>
            <option value="wired">Wired</option>
            <option value="wireless">Wireless</option>
          </ListInput>
          <ListInput
            label="Connection Status"
            id="clientStatus"
            type="select"
            value="connected"
            placeholder="Please choose..."
          >
            <option value="connected">Connected</option>
            <option value="failed_to_connect">Faild to connect</option>
          </ListInput>
        </List>
      </Page>
    </View>
  </Panel>

  <!-- Your main view, should have "view-main" class -->
  <View main class="safe-areas" url="/" />

  <!-- Popup -->
  <Popup id="my-popup">
    <View>
      <Page>
        <Navbar title="Popup">
          <NavRight>
            <Link popupClose>Close</Link>
          </NavRight>
        </Navbar>
        <Block>
          <p>Popup content goes here.</p>
        </Block>
      </Page>
    </View>
  </Popup>

  <LoginScreen id="my-login-screen">
    <View>
      <Page loginScreen>
        <LoginScreenTitle>Login</LoginScreenTitle>
        <List form>
          <ListInput
            type="text"
            name="username"
            placeholder="Your username"
            bind:value={username}
          />
          <ListInput
            type="password"
            name="password"
            placeholder="Your password"
            bind:value={password}
          />
        </List>
        <List>
          <ListButton title="Sign In" onClick={() => alertLoginData()} />
        </List>
        <BlockFooter>
          Some text about login information.<br />Click "Sign In" to close Login
          Screen
        </BlockFooter>
      </Page>
    </View>
  </LoginScreen>
</App>
