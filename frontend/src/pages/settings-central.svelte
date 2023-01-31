<script>
  import {
    f7,
    f7ready,
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
  import { Html5Qrcode } from "html5-qrcode";

  console.log(centralBaseUrl);

  let subscriptions = [];
  import {
    currentAccountStore,
    accountsStore,
    currentAccountIdStore,
    cameraStore,
  } from "../js/svelte-store.js";

  import { v4 as uuidv4 } from "uuid";
  import { get } from "svelte/store";
  import { onDestroy, onMount } from "svelte";

  export let f7router;

  /**
   * NOTE: This will overwrite the credential field on any refresh token upgrade!
   */

  let account = {
    id: "",
    base_url: centralBaseUrl.Internal,
    client_id: "",
    client_secret: "",
    credential: {},
    name: "",
  };
  let accountImport = {};
  let accountsMapping;
  let accountsData;
  let credentialString;
  let selectedAccountId;
  let newUUID = uuidv4();

  let exportPopupOpened = false;
  let importPopupOpened = false;
  let html5QrCode;

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        accountsStore.subscribe((value) => {
          accountsMapping = Object.entries(value).map(([k, v]) => ({
            id: v.id,
            name: v.name,
          }));
          accountsData = value;
        }),
        currentAccountIdStore.subscribe((value) => {
          selectedAccountId = value;
          selectAccount();
        })
      );
      selectAccount();
    })
  );

  onDestroy(() => {
    try {
      html5QrCode?.stop();
    } catch (err) {}
    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
  });

  function centralRefresh(callback) {
    return new Promise((resolve) => resolve())
      .then(() => f7.preloader.show())
      .then(() => central.refreshToken())
      .then((result) => {
        f7.toast.show({ text: "Success", closeTimeout: 2000 });
        console.log(result);
      })
      .then(() => {
        if (callback) callback();
      })
      .catch((e) => {
        console.log(e);
        f7.toast.show({
          text: e?.message ? e.message : `Error: ${JSON.stringify(e)}`,
          closeTimeout: 8000,
        });
      })
      .finally(() => f7.preloader.hide());
  }

  function centralRequest() {
    return central
      .ready(1)
      .then(() => f7.preloader.show())
      .then(() => central.getAllGroups())
      .then((result) => {
        f7.toast.show({ text: "Success", closeTimeout: 2000 });
        console.log(result);
      })
      .catch((e) => {
        console.log(e);
        f7.toast.show({
          text: e?.options?.responseBody?.description
            ? e.options.responseBody.description
            : `Error: ${JSON.stringify(e)}`,
          closeTimeout: 8000,
        });
      })
      .finally(() => f7.preloader.hide());
  }

  function saveCredential(directCredential = false) {
    accountsStore.update((value) => {
      if (!directCredential) account.credential = JSON.parse(credentialString);
      account.name = account.name.trim();
      value[selectedAccountId] = account;
      return value;
    });
    currentAccountIdStore.set(selectedAccountId);
    f7.toast.show({ text: "Credential saved", closeTimeout: 2000 });
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
        base_url: centralBaseUrl.Internal,
        client_id: "",
        client_secret: "",
        credential: {},
      };
      credentialString = "{}";
    }
  }

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

  function onImportPopupOpen() {
    html5QrCode = new Html5Qrcode("import-qr-reader");
    html5QrCode
      .start(
        { deviceId: { exact: get(cameraStore).id } },
        { fps: 10 },
        (decodedText, decodedResult) => {
          console.log(decodedResult);
          try {
            accountImport = JSON.parse(decodedText);
            console.log(accountImport);
            importPopupOpened = false;
            importAccountPrompt();
          } catch (e) {
            console.log(accountImport);
          }
        }
      )
      .catch((err) => {
        console.log(err);
      });
  }

  function exportQR() {
    exportPopupOpened = true;
  }

  function importQR() {
    importPopupOpened = true;
  }

  function importAccountPrompt() {
    // Prevent accidental overwriting of credentials
    if (
      account.name !== "New Account" &&
      (account.client_id || account.client_secret || credentialString !== "{}")
    )
      f7.dialog.prompt(
        `Overwrite "${account.name}"? Confirm by typing "${account.name}".`,
        (name) => {
          if (name.trimEnd() === account.name)
            f7.dialog.confirm(
              `Are you sure to overwrite "${account.name}"`,
              importAccount
            );
        }
      );
    else importAccount();
  }

  async function importAccount() {
    let testAccount = { ...account, ...accountImport };
    try {
      testAccount = await central.testToken(testAccount);
      account = testAccount;
      saveCredential(true);
      updateCredentialString();
      centralRefresh(() => {});
    } catch (e) {
      if (e.name === "TokenNotUpdated")
        f7.toast.show({
          text: "Token not correct. Please enter new one",
          closeTimeout: 2000,
        });
    }
  }
</script>

<Page>
  <Navbar title="Central Config" backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:checkmark_alt"
        iconAurora="f7:checkmark_alt"
        iconMd="material:done"
        tooltip="Save Credential"
        onClick={() => {
          saveCredential();
          f7router.back();
        }}
      />
    </NavRight>
  </Navbar>

  <BlockTitle>Account Selector</BlockTitle>
  <List>
    {#if accountsMapping}
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
    {/if}
  </List>

  <BlockTitle>Actions</BlockTitle>
  <Block strong>
    <Row style="justify-content: normal;">
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
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:qrcode"
          iconAurora="f7:qrcode"
          iconMd="material:qr_code"
          tooltip="Export"
          text="Export"
          onClick={exportQR}
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
          <img style="width: 100%;" id="qr-export-img" alt="" />
        </div>
        <div style="padding-left: 1em; padding-right: 1em;">
          Remember: A credential can only be used on one device at a time!
        </div>
      </div>
    </Page>
  </Popup>
  <Popup
    swipeToClose={true}
    class="popup-qr-import"
    opened={importPopupOpened}
    onPopupOpen={onImportPopupOpen}
    onPopupClosed={() => {
      importPopupOpened = false;
      try {
        html5QrCode.stop();
      } catch (e) {}
    }}
  >
    <Page>
      <Navbar title="QR Export">
        <NavRight>
          <Link popupClose>Close</Link>
        </NavRight>
      </Navbar>
      <!-- <div
        style="height: 100%; flex-direction: column;"
        class="display-flex justify-content-center align-items-center"
      > -->
      <div>
        {#if !(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)}
          <div
            style="padding-left: 1em; padding-right: 1em; text-align: center;"
          >
            <BlockTitle medium>Camera not supported!</BlockTitle>
          </div>
        {/if}
        <div id="import-qr-reader" width="600px" />

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
