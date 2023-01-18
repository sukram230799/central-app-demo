<script>
  import { value } from "dom7";
  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    List,
    ListInput,
    Row,
    Col,
    Button,
  } from "framework7-svelte";

  import { Central } from "../js/central";

  import {
    currentAccountStore,
    accountsStore,
    currentAccountIdStore,
  } from "../js/svelte-store.js";

  import { v4 as uuidv4 } from "uuid";

  /**
   * NOTE: This will overwrite the credential field on any refresh token upgrade!
   */

  let central = new Central();
  let account;
  let accountsMapping;
  let accountsData;
  let credentialString;
  let selectedAccountId;
  let newUUID = uuidv4();

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
    await central.refreshToken();
  }

  function centralRequest() {
    central.getDeviceFirmware("CN8BSW01FK").then((response) => {
      console.log(response);
    });
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
  <BlockTitle>Central Access Token</BlockTitle>
  <List noHairlinesMd>
    <ListInput
      label="Instance Name"
      type="text"
      placeholder="Internal"
      bind:value={account.name}
    />

    <ListInput
      label="Base URL"
      type="url"
      placeholder="https://internal-apigw.central.arubanetworks.com/"
      validate
      bind:value={account.base_url}
    />

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
