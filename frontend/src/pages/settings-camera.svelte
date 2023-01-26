<script>
  import {
    f7,
    Page,
    Navbar,
    Block,
    List,
    ListItem,
    BlockTitle,
  } from "framework7-svelte";

  import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
  import { onDestroy, onMount } from "svelte";

  import { cameraStore } from "../js/svelte-store";

  let camerasLoaded = false;

  let selected;
  cameraStore.subscribe((value) => {
    selected = value;
  });
  let selectedId = selected.id;
  let items = [selected];

  let disableSelector = true;
  let html5QrCode;

  $: console.log(selectedId);
  $: updateCamera(selectedId);

  async function updateCamera(id) {
    if (!camerasLoaded) return;
    cameraStore.update(() => items.find((obj) => obj.id === id));
    try {
      await html5QrCode?.stop();
    } catch (err) {}

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode
      .start({ deviceId: { exact: selectedId } }, { fps: 10 }, () => {})
      .catch((err) => {
        console.log(err);
      });
  }

  function onPageInit(event) {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          let cameraId = devices[0].id;
          items = devices;
          disableSelector = false;

          selected = items[0];

          camerasLoaded = true;
          console.log(items);
        }
      })
      .catch((err) => {});
  }

  onDestroy(() => {
    try {
      html5QrCode?.stop();
    } catch (err) {}
  });
</script>

<Page {onPageInit}>
  <Navbar title="Camera Setting" backLink="Back" />
  {#if camerasLoaded}
    <Block><div id="reader" width="600px" /></Block>
  {/if}
  <BlockTitle>Camera Setting</BlockTitle>
  <List>
    <ListItem
      title="Camera"
      smartSelect
      disabled={disableSelector}
      smartSelectParams={{ openIn: "popover" }}
    >
      <select name="camera" bind:value={selectedId}>
        {#each items as item}
          <option value={item.id}>{item.label}</option>
        {/each}
      </select>
    </ListItem>
  </List>
</Page>
