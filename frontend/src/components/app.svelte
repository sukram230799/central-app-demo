<script>
  import { onDestroy, onMount } from "svelte";

  import {
    f7,
    f7ready,
    theme,
    App,
    View,
    Popup,
    Page,
    Navbar,
    NavRight,
    Link,
    Block,
    LoginScreen,
    LoginScreenTitle,
    List,
    ListInput,
    ListButton,
    BlockFooter,
  } from "framework7-svelte";

  import routes from "../js/routes";
  import store from "../js/store";
  import { needRefreshStore, doRefreshStore } from "../js/svelte-store";
  import FilterPanel from "./filter-panel.svelte";

  location.replace("/#!/");

  let needRefreshToast;
  needRefreshStore.subscribe((value) => {
    if (value && value.updateAvailable) {
      needRefreshToast = f7.toast.create({
        text: "New content available, click on load button to update.",
        closeButtonText: "load",
        closeButton: true,
        on: {
          close: function () {
            console.log("Update service-worker!");
            console.log(value.updateSW);
            doRefreshStore.set({ doRefresh: true });
          },
        },
      });
      needRefreshToast.open();
    }
  });

  // Framework7 Parameters
  let f7params = {
    name: "Central Toolkit", // App name
    id: "dev.wuest.central",
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
    view: {
      // pushState: true,
      browserHistory: true,
      // browserHistoryRoot: "/",
    },
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
</script>

<App {...f7params}>
  <FilterPanel />

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
