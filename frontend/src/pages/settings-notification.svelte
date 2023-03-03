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
    f7,
  } from "framework7-svelte";
  const debug = process.env.NODE_ENV !== "production";

  import { central } from "../js/central";
  import { errorToast } from "../js/operations/error-toast";

  import { push } from "../js/push";

  function registerServiceWorker() {
    return push.registerServiceWorker().catch((e) => errorToast(f7, e));
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
          ><Button raised on:click={registerServiceWorker}>Register SW</Button
          ></Col
        >
        <Col
          ><Button raised disabled tooltip="Not saved on backend"
            >Unregister SW</Button
          ></Col
        >
      </Row>
    {/if}
    <Row>
      <Col><Button raised on:click={subscribeToPush}>Subscribe</Button></Col>
      <Col
        ><Button raised on:click={unsubscribeFromPush}>Unsubscribe</Button></Col
      >
    </Row>
    {#if debug}
      <Row>
        <Col><Button raised on:click={notifyMe}>Notify me</Button></Col>
        <Col><Button raised>Notify all</Button></Col>
      </Row>
    {/if}
  </Block>
</Page>
