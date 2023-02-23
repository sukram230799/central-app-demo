<script>
  import {
    f7,
    f7ready,
    Page,
    Navbar,
    Block,
    List,
    ListItem,
    BlockTitle,
  } from "framework7-svelte";

  import { Html5Qrcode } from "html5-qrcode";
  import { onDestroy, onMount } from "svelte";

  let subscriptions = [];
  import { cameraStore } from "../js/svelte-store";

  let camerasLoaded = false;

  let selected;
  let selectedId = "";

  let items = [];

  let disableSelector = true;
  let html5QrCode;

  $: console.log(selectedId);
  $: updateCamera(selectedId);

  onMount(() =>
    f7ready(() => {
      subscriptions.push(
        cameraStore.subscribe((value) => {
          selected = value;
          if (!items.length) items = [selected];
          selectedId = selected.id;
        })
      );
      getCameras();
    })
  );

  async function updateCamera(id) {
    if (!camerasLoaded) return;
    cameraStore.update(() => items.find((obj) => obj.id === id));
    try {
      await html5QrCode?.stop();
    } catch (e) {}

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode
      .start({ deviceId: { exact: selectedId } }, { fps: 10 }, () => {})
      .catch((err) => {
        console.log(err);
      });
  }

  function getCameras() {
    return Html5Qrcode.getCameras()
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
    } catch (e) {}

    subscriptions.forEach((subscription) => subscription());
    subscriptions = [];
  });
</script>

<Page>
  <Navbar title="Camera Setting" backLink="Back" />
  {#if camerasLoaded}
    <Block><div id="reader" width="600px" /></Block>
  {/if}
  <BlockTitle>Camera Setting</BlockTitle>
  <List>
    {#if selected}
      <ListItem
        title="Camera"
        smartSelect
        disabled={disableSelector}
        smartSelectParams={{ openIn: "popover" }}
      >
        <select name="camera" bind:value={selectedId}>
          {#each items as item}
            <option value={item?.id}>{item?.label}</option>
          {/each}
        </select>
      </ListItem>
    {/if}
  </List>
</Page>
