<script>
  import {
    theme,
    Page,
    Navbar,
    Block,
    BlockTitle,
    List,
    ListItem,
    ListInput,
    Subnavbar,
    Searchbar,
  } from "framework7-svelte";

  import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
  import { Central } from "../js/central";

  import { cameraStore } from "../js/svelte-store";

  let cameraId;

  cameraStore.subscribe((value) => (cameraId = value.id));

  let readerVisible = true;

  let serialNumber = "";
  let infoString = "";
  let info = {};
  //   device_status: "Up",
  //   firmware_version: "16.10.0021",
  //   hostname: "Aruba-2930F-8G-PoEP-2SFPP",
  //   is_reboot_enable: true,
  //   is_stack: false,
  //   mac_address: "54:80:28:aa:aa:50",
  //   model: "Aruba2930F-8G-PoE+-2SFP+ Switch(JL258A)",
  //   recommended: "16.10.0021",
  //   serial: "CN8BSW01FK",
  //   status: {
  //     reason: "Firmware version upto date",
  //     state: "UPGRADE_NOT_REQUIRED",
  //   },
  //   upgrade_required: false,
  // };

  let html5QrCode;

  function onPageInit(event) {
    // This method will trigger user permissions
    console.log("Test");
    Html5Qrcode.getCameras()
      .then((devices) => {
        /**
         * devices would be an array of objects of type:
         * { id: "id", label: "label" }
         */
        if (devices && devices.length) {
          let cameraId = devices[0].id;
          // .. use this to start scanning.
          items = devices.map((device) => {
            title: device.label, subtitle.id;
          });
          console.log(items);
        }
      })
      .catch((err) => {
        // handle err
      });

    html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      // handle success
      console.log(decodedResult);

      if (serialNumber != decodedText) {
        serialNumber = decodedText;
        new Central().getDeviceFirmware(serialNumber).then((result) => {
          info = result;
          infoString = JSON.stringify(result, null, 4);
          console.log(result);
        });
      }
      // html5QrCode
      //   .stop()
      //   .then((ignore) => {
      //     // debugger;
      //     // alert(decodedText);
      //     // console.log("HIDE!");
      //     // readerVisible = false;
      //     serialNumber = decodedText;
      //     new Central().getDeviceFirmware(serialNumber).then((result) => {
      //       infoString = JSON.stringify(result.responseBody, null, 4);
      //       console.log(result);
      //     });
      //   })
      //   .catch((err) => {
      //     // Stop failed, handle it.
      //   });
    };
    const qrConfig = {
      fps: 10,
      // qrbox: { width: 250, height: 250 }
    };

    // If you want to prefer front camera
    html5QrCode
      .start(
        { deviceId: { exact: cameraId } },
        // { facingMode: "environment" },
        qrConfig,
        qrCodeSuccessCallback
      )
      .catch((err) => {
        console.log(err);
      });
  }

  function onPageAfterOut() {
    html5QrCode.html5QrCode.stop(); //.catch((err) => console.log(err));
  }
</script>

<Page on:pageInit={onPageInit} on:pageBeforeUnmount={onPageAfterOut}>
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
