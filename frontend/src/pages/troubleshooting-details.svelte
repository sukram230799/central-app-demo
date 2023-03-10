<script>
  import { onMount } from "svelte";

  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    List,
    ListItem,
    ListInput,
    Button,
    Progressbar,
  } from "framework7-svelte";

  import { central } from "../js/central";

  export let deviceType;
  export let command = {
    arguments: [
      {
        description: "IP address or hostname of host",
        name: "Host",
      },
      {
        description: "Please provide additional arguments as options",
        name: "Options",
      },
    ],
    category: "Tools",
    command: "ping",
    command_id: 2369,
    summary: "Ping",
  };

  let serialNumber = "";
  let devices = [];
  let argumentValues = [];
  let argumentNames = command.arguments?.map((value) => value.name);

  let loadingDevices = true;

  let running = false;
  let done = false;
  let failed = false;

  let output = "";
  const exampleOutput = `
=== Troubleshooting session started. === 


===================================
Output Time: 2023-01-20 08:48:13 UTC


COMMAND=show ap bss-table

Aruba AP BSS Table
------------------
bss                ess           port  ip             band/ht-mode/bandwidth  ch/EIRP/max-EIRP  type  cur-cl  ap name  in-t(s)  tot-t            flags  mu-mimo
---                ---           ----  --             ----------------------  ----------------  ----  ------  -------  -------  -----            -----  -------
80:8d:b7:2a:aa:a0  Secure-Aruba  ?/?   192.168.0.211  2.4GHz/HT/20MHz         11/19.0/19.5      ap    0       IAP-315  0        34d:18h:56m:38s  Kr     0
80:8d:b7:2a:aa:a1  WLAN-Aruba    ?/?   192.168.0.211  2.4GHz/HT/20MHz         11/19.0/19.5      ap    2       IAP-315  0        34d:18h:56m:36s  K      0
80:8d:b7:2a:aa:b0  Secure-Aruba  ?/?   192.168.0.211  5GHz/VHT/80MHz          128E/30.0/30.0    ap    0       IAP-315  0        34d:18h:56m:38s  Kr     1
80:8d:b7:2a:aa:b1  WLAN-Aruba    ?/?   192.168.0.211  5GHz/VHT/80MHz          128E/30.0/30.0    ap    8       IAP-315  0        34d:18h:56m:36s  K      1

Channel followed by "*" indicates channel selected due to unsupported configured channel.
"Spectrum" followed by "^" indicates Local Spectrum Override in effect.

Num APs:4
Num Associations:10

Flags:       a = Airslice policy; A = Airslice app monitoring; c = MBO Cellular Data Capable BSS; d = Deferred Delete Pending; D = VLAN Discovered; E = Enhanced-open BSS without transition mode; I = Imminent VAP Down; K = 802.11K Enabled; m = Agile Multiband (MBO) BSS; M = WPA3-SAE mixed mode BSS; o = Enhanced-open transition mode open BSS; O = Enhanced-open BSS with transition mode; r = 802.11r Enabled; t = Broadcast TWT Enabled; T = Individual TWT Enabled; W = 802.11W Enabled; x = MBSSID Tx BSS; 3 = WPA3 BSS; 

=== Troubleshooting session completed ===
`;

  function run() {
    running = true;
    output = "";
    // debugger;
    central
      .startTroubleshootingSession({
        serial: serialNumber,
        device_type: deviceType,
        commands: [
          {
            command_id: command.command_id,
            arguments: argumentValues.map((value, i) => ({
              name: argumentNames[i],
              value: argumentValues[i],
            })),
          },
        ],
      })
      .then(async (session) => {
        for (let i = 1; i <= 4; i++) {
          await new Promise((resolve) => setTimeout(resolve, i * i * 500));
          let tsOutput = await central.getTroubleshootingOutput({
            session_id: session.session_id,
            serial: serialNumber,
          });
          console.log(tsOutput.status, tsOutput);
          
          if (tsOutput.status === "RUNNING") {
          } else if (tsOutput.status === "COMPLETED") {
            console.log(tsOutput.output);
            output = tsOutput.output.trimStart();
            running = false;
            done = true;
            break;
          } else if (tsOutput.status === "EXPIRED") {
            output = "EXPIRED";
            running = false;
            failed = true;
            break;
          } else {
            output = tsOutput;
          }
        }
      });
  }

  onMount(() => {
    central
      .ready(1)
      .then(() => {
        return central.getDevicesFromDeviceInventory({ sku_type: deviceType });
      })
      .then((devicesList) => {
        console.log(devicesList);
        devices = devicesList.devices;
        loadingDevices = false;
      });
  });
</script>

<Page>
  <Navbar title={command.summary} backLink="Back" />
  {#if command.arguments}
    <BlockTitle>Arguments</BlockTitle>
    <List>
      {#each Array.from(Array(command.arguments.length).keys()) as i}
        <ListInput
          label={command.arguments[i].name}
          type={"text"}
          clearButton
          info={command.arguments[i].description}
          bind:value={argumentValues[i]}
        />
      {/each}
    </List>
  {/if}
  <BlockTitle>Run</BlockTitle>
  <List>
    <ListItem
      title="Device"
      smartSelect
      smartSelectParams={{
        openIn: "popup",
        searchbar: true,
        searchbarPlaceholder: "Search Device",
      }}
      disabled={loadingDevices || running}
    >
      <select name="device" bind:value={serialNumber}>
        {#each devices as device}
          <option value={device.serial}>{device.serial} - {device.model}</option
          >
        {/each}
      </select>
    </ListItem>
  </List>
  <Block>
    <Button raised fill on:click={run} disabled={!serialNumber}>Run</Button>
  </Block>
  {#if running || failed}
    <List simpleList>
      <ListItem>
        {#if running}
          <Progressbar infinite />
        {:else if failed}
          <Progressbar color="red" progress={100} />
        {/if}
      </ListItem>
    </List>
  {/if}
  {#if done || failed}
    <BlockTitle>Status</BlockTitle>
    <Block strong>
      <pre style="overflow: auto !important; overflow-y: scroll;"><code
          class="codeblock"
          style="overflow: auto">{output}</code
        ></pre>
    </Block>
  {/if}
</Page>
