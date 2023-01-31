<script>
  import {
    f7ready,
    theme,
    Page,
    Navbar,
    Block,
    BlockTitle,
    List,
    ListItem,
  } from "framework7-svelte";

  import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
  import { onDestroy, onMount } from "svelte";
  import { central } from "../js/central";

  let subscriptions = [];
  import { cameraStore } from "../js/svelte-store";

  let cameraId;

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        cameraStore.subscribe((value) => (cameraId = value.id))
      );

      startReader();
    })
  );

  onDestroy(() => {
    html5QrCode.stop();
    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
  });

  let readerVisible = true;

  let serialNumber = "";
  let infoString = "";
  let info = {};

  let html5QrCode;

  function qrCodeSuccessCallback(decodedText, decodedResult) {
    if (serialNumber != decodedText) {
      serialNumber = decodedText;
      central.getDeviceFirmware(serialNumber).then((result) => {
        info = result;
        infoString = JSON.stringify(result, null, 4);
        console.log(result);
      });
    }
  }

  function startReader() {
    html5QrCode = new Html5Qrcode("reader");
    const qrConfig = {
      fps: 10,
    };

    html5QrCode
      .start({ deviceId: { exact: cameraId } }, qrConfig, qrCodeSuccessCallback)
      .catch((err) => {
        console.log(err);
      });
  }
</script>

<Page>
  <Navbar title="Firmware" backLink="Back" />
  <BlockTitle>Barcode Scanner</BlockTitle>

  {#if readerVisible}
    <Block strong>
      <div id="reader" width="600px" />
    </Block>
  {/if}
  {#if serialNumber}
    <Block strong>
      {serialNumber}
    </Block>
  {/if}
  {#if info}
    <BlockTitle>Firmware Info</BlockTitle>
    <List>
      {#each Object.entries(info) as [title, data]}
        <ListItem {title} after={data} />
      {/each}
    </List>
  {/if}
  {#if infoString}
    <Block strong>
      {infoString}
    </Block>
  {/if}
</Page>
