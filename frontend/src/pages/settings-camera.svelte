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
  // import store from "../js/store.js";
  import { cameraStore } from "../js/svelte-store";
  // import { f7 } from 'framework7-svelte';

  console.log("Camera");
  console.log(f7.store.state.camera);
  let smartSelectComponent;

  // let selected = {
  //   id: "d3f5ceb340cf8ddbec8422380bc32693a8b284a453e3aa76b67b8f6a423bc2f5",
  //   label: "HP HD Camera (0408:5373)",
  // };
  // let selected = f7.store.state.camera;

  let selected;
  cameraStore.subscribe((value) => {
    selected = value;
  });
  let selectedId = selected.id;
  let items = [selected];

  let disableSelector = true;

  $: console.log(selectedId);
  $: cameraStore.update(() => items.find((obj) => obj.id === selectedId));
  // $: selectedId, f7.store.dispatch('getUsers', { total: 10 })
  // $: console.log(selectedId);

  function onPageInit(event) {
    // to get instance in some method
    const smartSelectInstance = smartSelectComponent.smartSelectInstance();

    Html5Qrcode.getCameras()
      .then((devices) => {
        /**
         * devices would be an array of objects of type:
         * { id: "id", label: "label" }
         */
        if (devices && devices.length) {
          let cameraId = devices[0].id;
          // .. use this to start scanning.
          items = devices;
          disableSelector = false;

          selected = items[0];

          console.log(items);
        }
      })
      .catch((err) => {
        // handle err
      });
  }
</script>

<Page {onPageInit}>
  <Navbar title="Camera Setting" backLink="Back" />
  <BlockTitle>Camera Setting</BlockTitle>
  <List>
    <ListItem
      title="Camera"
      smartSelect
      disabled={disableSelector}
      bind:this={smartSelectComponent}
    >
      <select name="camera" bind:value={selectedId}>
        {#each items as item}
          <option value={item.id}>{item.label}</option>
        {/each}
      </select>
    </ListItem>
  </List>
</Page>
