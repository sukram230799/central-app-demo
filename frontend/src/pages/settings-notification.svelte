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

  function registerServiceWorker() {
    return push.registerServiceWorker().catch((e) => errorToast(f7, e));
  }

  function unregisterServiceWorker() {
    return push.unregisterServiceWorker().catch((e) => errorToast(f7, e));
  }

  function subscribeToPush() {
    return push.registerPush().catch((e) => errorToast(f7, e));
  }

  function unsubscribeFromPush() {
    return push.unregisterPush().catch((e) => errorToast(f7, e));
  }

  function notifyMe() {
    return push.notifyMe().catch((e) => errorToast(f7, e));
  }
</script>

<Page>
  <Navbar title="Notification" backLink="Back" />
  <BlockTitle>Manage Subscription</BlockTitle>
  <Block>
    {#if debug}
      <Row>
        <Col
          ><Button raised onClick={registerServiceWorker}>Register SW</Button
          ></Col
        >
        <Col
          ><Button raised onClick={unregisterServiceWorker}
            >Unregister SW</Button
          ></Col
        >
      </Row>
    {/if}
    <Row>
      <Col><Button raised onClick={subscribeToPush}>Subscribe</Button></Col>
      <Col
        ><Button raised onClick={unsubscribeFromPush}>Unsubscribe</Button></Col
      >
    </Row>
    {#if debug}
      <Row>
        <Col><Button raised onClick={notifyMe}>Notify me</Button></Col>
        <Col><Button raised>Notify all</Button></Col>
      </Row>
    {/if}
  </Block>
  <BlockTitle>How-To (manual)</BlockTitle>
  <Block>
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
      <li>Under Webhook select "{central.generateWebhookName()}".</li>
    </ol>
  </Block>
  <BlockTitle>Configure here</BlockTitle>
  <Block>This may break your existing alerts. Use with caution.</Block>
  <List>
    <ListItem href="/settings/notification/alerts" title="Select Alerts" />
  </List>
</Page>
