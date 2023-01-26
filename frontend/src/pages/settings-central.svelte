<script>
  import {
    f7,
    Page,
    Navbar,
    NavRight,
    Block,
    BlockTitle,
    List,
    ListInput,
    ListItem,
    Row,
    Col,
    Button,
    Link,
    Popup,
  } from "framework7-svelte";
  import QRCode from "qrcode";

  import { central } from "../js/central";
  import centralBaseUrl from "../js/central-base-url.json";

  console.log(centralBaseUrl);

  import {
    currentAccountStore,
    accountsStore,
    currentAccountIdStore,
  } from "../js/svelte-store.js";

  import { v4 as uuidv4 } from "uuid";

  /**
   * NOTE: This will overwrite the credential field on any refresh token upgrade!
   */

  let account = {
    id: "",
    base_url: "",
    client_id: "",
    client_secret: "",
    credential: {},
    name: "",
  };
  let accountsMapping;
  let accountsData;
  let credentialString;
  let selectedAccountId;
  let newUUID = uuidv4();

  let exportPopupOpened = false;

  accountsStore.subscribe((value) => {
    accountsMapping = Object.entries(value).map(([k, v]) => ({
      id: v.id,
      name: v.name,
    }));
    accountsData = value;
  });

  currentAccountIdStore.subscribe((value) => {
    selectedAccountId = value;
    // account = accountsData[selectedAccountId];
    // updateCredentialString();
    selectAccount();
  });

  async function centralRefresh() {
    try {
      f7.preloader.show();
      await central.refreshToken();
      f7.preloader.hide();
    } catch (e) {
      if (e.name === "TokenNotUpdated") {
      }
    }
  }

  async function centralRequest() {
    f7.preloader.show();
    let response = await central.getDeviceFirmware("CN8BSW01FK");
    f7.preloader.hide();
    console.log(response);
  }

  function saveCredential() {
    accountsStore.update((value) => {
      account.credential = JSON.parse(credentialString);
      value[selectedAccountId] = account;
      return value;
    });
    currentAccountIdStore.set(selectedAccountId);
  }

  function updateCredentialString() {
    if (account && "credential" in account)
      credentialString = JSON.stringify(account.credential, null, 2);
    else credentialString = "";
  }

  function selectAccount() {
    if (!selectedAccountId) selectedAccountId = newUUID;
    if (accountsData && selectedAccountId in accountsData) {
      account = accountsData[selectedAccountId];
      updateCredentialString();
    } else {
      account = {
        id: selectedAccountId,
        name: "New Account",
        base_url: "",
        client_id: "",
        client_secret: "",
        credential: {},
      };
      credentialString = "{}";
    }
  }

  function onPageInit(event) {}

  function onExportPopupOpen() {
    QRCode.toDataURL(
      JSON.stringify({ ...account, id: undefined, name: undefined }),
      function (error, url) {
        if (error) console.error(error);
        var img = document.getElementById("qr-export-img");
        img.src = url;
        console.log("success!");
      }
    );
  }

  function exportQR() {
    exportPopupOpened = true;
  }

  function importQR() {}
</script>

<Page on:pageInit={onPageInit}>
  <Navbar title="Central Config" backLink="Back" />

  <BlockTitle>Account Selector</BlockTitle>
  <List>
    <ListInput
      label="Account"
      type="select"
      bind:value={selectedAccountId}
      on:change={() => {
        selectAccount();
      }}
    >
      {#each accountsMapping as accountMapping}
        <option value={accountMapping.id}>{accountMapping.name}</option>
      {/each}
      <option value={newUUID}>New Account...</option>
    </ListInput>
  </List>

  <BlockTitle>Actions</BlockTitle>
  <Block strong>
    <Row style="justify-content: normal;">
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:qrcode"
          iconAurora="f7:qrcode"
          iconMd="material:qr_code"
          on:click={console.log}
          tooltip="Export"
          text="Export"
          onClick={exportQR}
        />
      </Col>
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:qrcode_viewfinder"
          iconAurora="f7:qrcode_viewfinder"
          iconMd="material:qr_code_scanner"
          on:click={importQR}
          tooltip="Import"
          text="Import"
        />
      </Col>
    </Row>
  </Block>
  <Popup
    swipeToClose={true}
    class="popup-qr-export"
    opened={exportPopupOpened}
    onPopupClosed={() => (exportPopupOpened = false)}
    onPopupOpen={onExportPopupOpen}
  >
    <Page>
      <Navbar title="QR Export">
        <NavRight>
          <Link popupClose>Close</Link>
        </NavRight>
      </Navbar>
      <div
        style="height: 100%; flex-direction: column;"
        class="display-flex justify-content-center align-items-center"
      >
        <div>
          <img style="width: 100%;" id="qr-export-img" />
        </div>
        <div style="padding-left: 1em; padding-right: 1em;">
          Remember: A credential can only be used on one device at a time!
        </div>
      </div>
    </Page>
  </Popup>

  <BlockTitle>Central Access Token</BlockTitle>
  <List noHairlinesMd>
    <ListInput
      label="Instance Name"
      type="text"
      placeholder="Internal"
      bind:value={account.name}
    />

    <ListItem
      title="Central Instance"
      smartSelect
      smartSelectParams={{ openIn: "popover" }}
    >
      <select name="selectedSortingOrder" bind:value={account.base_url}>
        {#each Object.entries(centralBaseUrl) as [name, url]}
          <option value={url}>{name}</option>
        {/each}
      </select>
    </ListItem>

    <ListInput
      label="Client Id"
      type="text"
      placeholder="7kD..."
      bind:value={account.client_id}
    />

    <ListInput
      label="Client Secret"
      type="text"
      placeholder="s1f..."
      bind:value={account.client_secret}
    />

    <ListInput
      type="textarea"
      label="Credential / Token"
      placeholder={JSON.stringify({
        access_token: "Mvj...",
        appname: "nms",
        authenticated_userid: "user.name@example.com",
        created_at: 1673944248,
        credential_id: "03c4545d-d608-41cd-80b0-66eab7da4366",
        expires_in: 7200,
        id: "4dbbfc0d-4936-41b9-80e4-54d3fb8fb509",
        refresh_token: "bI8...",
        scope: "all",
        token_type: "bearer",
      })}
      resizable
      bind:value={credentialString}
    />

    <ListInput label="Credential Id" type="text" value={account.id} disabled />
  </List>
  <Block>
    <Row>
      <Col width="100">
        <Button fill raised onClick={saveCredential}>Save Credential</Button>
      </Col>
    </Row>
  </Block>

  <BlockTitle>Test Central API</BlockTitle>
  <Block strong>
    <Row>
      <Col width="50">
        <Button fill raised onClick={centralRequest}>Request</Button>
      </Col>
      <Col width="50">
        <Button fill raised onClick={centralRefresh}>Refresh</Button>
      </Col>
    </Row></Block
  >
</Page>
