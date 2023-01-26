<script>
  import {
    Page,
    Button,
    Row,
    Col,
    Popup,
    BlockTitle,
    List,
    ListInput,
    ListItem,
    Navbar,
    NavRight,
    NavTitle,
    NavTitleLarge,
    Link,
    Toolbar,
    Block,
    BlockHeader,
  } from "framework7-svelte";

  import centralBaseUrl from "../js/central-base-url.json";

  import QRCode from "qrcode";

  let account = {
    base_url: "https://internal-apigw.central.arubanetworks.com/",
    client_id: "",
    client_secret: "",
    credential: {},
  };
  let credentialString = "";
  let popupOpened = false;

  function onPopupOpen() {
    account.credential = JSON.parse(credentialString);
    QRCode.toDataURL(JSON.stringify(account), function (error, url) {
      if (error) console.error(error);
      var img = document.getElementById("qr-export-img");
      img.src = url;
      console.log("success!");
    });
  }
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar>
    <NavTitle>Central Toolkit Onboard</NavTitle>
    <NavTitleLarge>Central Toolkit Onboard</NavTitleLarge>
  </Navbar>
  <!-- Toolbar -->
  <Toolbar bottom>
    <div />
    <Link popupOpen=".popup-impressum">Impressum</Link>
  </Toolbar>
  <!-- Page content -->
  <div style="display: block;">
    <BlockTitle>Central Access Token</BlockTitle>
    <List noHairlinesMd>
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
    </List>
    <Block>
      <Row>
        <Col width="100">
          <Button fill raised onClick={() => (popupOpened = true)}
            >Generate QR Code</Button
          >
        </Col>
      </Row>
    </Block>
  </div>
  <Popup
    swipeToClose={true}
    class="popup-qr-export"
    opened={popupOpened}
    onPopupClosed={() => (popupOpened = false)}
    {onPopupOpen}
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
  <Popup class="popup-impressum">
    <Page>
      <Navbar title="Impressum">
        <NavRight>
          <Link popupClose>Close</Link>
        </NavRight>
      </Navbar>
      <Block>
        <BlockHeader>Angaben gem&auml;&szlig; &sect; 5 TMG</BlockHeader>

        <p>
          Markus Philipp W&uuml;st<br />
          Teinacher Str. 6<br />
          71034 B&ouml;blingen
        </p>

        <BlockHeader>Kontakt</BlockHeader>
        <p>
          Telefon: +4970314667810<br />
          E-Mail: sukram230799@wuest.dev
        </p>

        <p>Quelle: <a href="https://www.e-recht24.de">e-recht24.de</a></p>
      </Block>
    </Page>
  </Popup>
</Page>
