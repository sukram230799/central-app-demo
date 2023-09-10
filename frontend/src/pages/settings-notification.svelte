<script>
  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    Row,
    Col,
    Button,
    Link,
    f7,
    List,
    ListItem,
  } from "framework7-svelte";
  const debug = process.env.NODE_ENV !== "production";

  import { central } from "../js/central";
  import { errorToast } from "../js/operations/error-toast";

  import { push } from "../js/push";
  import { webhookStore } from "../js/svelte-store";

  let noWID = true;

  webhookStore.subscribe((wid) => (noWID = !wid));

  function registerServiceWorkerDEV() {
    return push.registerServiceWorkerDEV().catch((e) => errorToast(f7, e));
  }

  function unregisterServiceWorkerDEV() {
    return push.unregisterServiceWorkerDEV().catch((e) => errorToast(f7, e));
  }

  function subscribeToPush() {
    return push
      .registerPush()
      .then(() =>
        f7.toast.show({
          text: "Success! You can add alerts now.",
          closeTimeout: 2000,
        })
      )
      .catch((e) => errorToast(f7, e));
  }

  function unsubscribeFromPush() {
    return push
      .unregisterPush()
      .then(() =>
        f7.toast.show({
          text: "Success! Your subscription was removed.",
          closeTimeout: 2000,
        })
      )
      .catch((e) => errorToast(f7, e));
  }

  function notifyMe() {
    return push
      .notifyMe()
      .then(() =>
        f7.toast.show({
          text: "Success! You should receive a notification from the backend. Use Test Central Notification to test the full chain.",
          closeTimeout: 5000,
        })
      )
      .catch((e) => errorToast(f7, e));
  }

  function testWebhook() {
    return central
      .testWebhook()
      .then(() =>
        f7.toast.show({
          text: "Success! You should receive a notification.",
          closeTimeout: 2000,
        })
      )
      .catch((e) => errorToast(f7, e));
  }
</script>

<Page class="grid-demo">
  <Navbar title="Notification Settings" backLink="Back" />
  <BlockTitle>Manage Notification Subscription</BlockTitle>
  <Block strong>
    Please note: Web Notifications are currently not supported on iOS. You can
    try to enable them from iOS version 16.4 onwards.
  </Block>
  <Block>
    {#if debug}
      <Row>
        <Col
          ><Button raised onClick={registerServiceWorkerDEV}>Register SW</Button
          ></Col
        >
        <Col>
          <Button raised onClick={unregisterServiceWorkerDEV}>
            Unregister SW
          </Button>
        </Col>
      </Row>
    {/if}
    <Row>
      <Col>
        Click on subscribe to enable notifiactions and register your device as a
        Webhook in Central. With unsubscribe you can remove the subscription and
        the Webhook in Central. Please keep in mind that there exists a limit in
        Central for how many webhooks you can register per account.
      </Col>
    </Row><Row>
      <Col><Button raised onClick={subscribeToPush}>Subscribe</Button></Col>
      <Col
        ><Button raised onClick={unsubscribeFromPush}>Unsubscribe</Button></Col
      >
    </Row><Row>
      <Col>
        Once you are subscribed you can test the Central Notification. They are
        triggered directly via Central. Once you click should receive a push
        notifiaction within a few seconds.
      </Col>
    </Row><Row>
      <Col><Button raised onClick={notifyMe}>Test Notification</Button></Col>
    </Row><Row>
      <Col
        ><Button raised onClick={testWebhook} disabled={noWID}
          >Test Central Notification</Button
        ></Col
      >
    </Row>
  </Block>
  <BlockTitle>How-To (manual)</BlockTitle>
  <Block>
    To receive push notifications on your device, you have to subscribe to the
    Alerts from Central. The recommended way is to use your desktop and enable
    it directly in Central. The instructions can be found below. You can also
    try it directly from within the App.
    <ol
      style="padding: 0;
    margin-left: 1em;"
    >
      <li>
        On your desktop go to your Central Instance via <Link
          external
          target="_blank"
          href="https://common.cloud.hpe.com"
          >https://common.cloud.hpe.com/</Link
        >.
      </li>
      <li>Then go to Alerts & Events.</li>
      <li>Click on Configure in the top left.</li>
      <li>Select which Alerts you want to receive.</li>
      <li>Once you selected an alert enable the Webhook checkbox.</li>
      <li>
        In the filed next to Webhook select "{central.generateWebhookName()}".
      </li>
      <li>Then click on save.</li>
      <li>Once the Alert triggers you should receive a notifiaction.</li>
    </ol>
  </Block>
  <BlockTitle>Configure directly in App</BlockTitle>
  <Block
    >Please be advised that it might have unintended consequences. <b
      >If you rely on Alerts and Webhooks for security critical systems, the
      editing directly in the App might not be ideal for you.</b
    > You can still use the manual instructions above if you want to try push notifications.</Block
  >
  <List>
    <ListItem
      href="/settings/notification/alerts"
      title="Select Alerts (use with caution)"
    />
  </List>
</Page>

<style>
  :global(.grid-demo div[class*="col"]) {
    margin-bottom: 15px;
  }
</style>
