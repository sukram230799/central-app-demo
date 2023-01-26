<script>
  import {
    theme,
    f7,
    f7ready,
    Page,
    Navbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    List,
    ListItem,
    Searchbar,
    Row,
    Col,
  } from "framework7-svelte";
  import { central } from "../js/central";

  export let device;

  const deviceAP = {
    ap_deployment_mode: "IAP",
    ap_group: null,
    cluster_id: "",
    controller_name: "",
    firmware_version: "10.4.0.0-10.4.0.0-beta_85756",
    gateway_cluster_id: "",
    gateway_cluster_name: "",
    group_name: "Home-AP-Group",
    ip_address: "192.168.0.211",
    labels: [],
    last_modified: 1672885294,
    macaddr: "80:8d:b7:aa:aa:aa",
    mesh_role: "Unknown",
    model: "315",
    name: "IAP-315",
    notes: null,
    public_ip_address: "91.23.84.37",
    radios: [
      {
        band: 1,
        index: 0,
        macaddr: "80:8d:b7:2a:aa:b0",
        radio_name: "Radio 5 GHz",
        radio_type: "802.11ac",
        spatial_stream: "4x4:4",
        status: "Up",
      },
      {
        band: 0,
        index: 1,
        macaddr: "80:8d:b7:2a:aa:a0",
        radio_name: "Radio 2.4 GHz",
        radio_type: "802.11n",
        spatial_stream: "2x2:2",
        status: "Up",
      },
    ],
    serial: "CNG0AP01FK",
    site: "BBN-Home",
    status: "Up",
    subnet_mask: "255.255.255.0",
    swarm_id: "",
    swarm_master: false,
    swarm_name: "IAP-315",
  };

  const deviceSwitch = {
    firmware_version: "16.10.0021",
    group_id: 38,
    group_name: "SW-Template",
    ip_address: "192.168.0.210",
    label_ids: [],
    labels: [],
    macaddr: "54:80:28:aa:aa:50",
    model: "Aruba2930F-8G-PoE+-2SFP+ Switch(JL258A)",
    name: "Aruba-2930F-8G-PoEP-2SFPP",
    public_ip_address: "91.23.84.37",
    serial: "CN8BSW01FK",
    site: "BBN-Home",
    site_id: 1,
    stack_id: null,
    status: "Up",
    switch_type: "AOS-S",
    uplink_ports: null,
    usage: 1112664,
  };

  console.log(device);

  let handledEntriesAP = {
    Details: {
      name: "Name",
      model: "Model",
      ip_address: "IP",
      macaddr: "MAC",
      serial: "Serial",
      firmware_version: "Firmware",
    },
    "Group / Site / Label": {
      group_name: "Group Name",
    },
    Swarm: {
      swarm_name: "Swarm Name",
      swarm_id: "Swarm Id",
      swarm_master: "Is Swarm Master?",
    },
  };
  let handledEntriesSwitch = {
    Details: {
      name: "Name",
      model: "Model",
      switch_type: "Type",
      ip_address: "IP",
      macaddr: "MAC",
      serial: "Serial",
      firmware_version: "Firmware",
    },
    "Group / Site / Label": {
      group_name: "Group Name",
    },
  };
  let handledEntriesGateway = {};

  let rebootToast;

  async function rebootDevice() {
    f7.dialog.confirm(
      `Reboot the following device?<br>${device.name},<br>MAC: ${device.macaddr},<br>IP: ${device.ip_address}`,
      "Reboot Device?",
      async () => {
        f7.preloader.show();
        let result = await central.rebootDevice({ serial: device.serial });
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          let status = await central.getStatus({
            task_id: result.task_id,
          });
          if (status.state !== "QUEUED") {
            if (status.state === "SUCCESS") {
              rebootToast = f7.toast.create({
                text: `Device rebooted`,
                closeTimeout: 2000,
              });
              rebootToast.open();
            }
            f7.preloader.hide();
            break;
          }
        }
      }
    );
  }

  let ledBlinking = false;
  let ledToast;

  async function blinkLED() {
    f7.preloader.show();
    let result;
    console.log(`LED Blink, current state ${ledBlinking ? "On" : "Off"}`);

    if (!ledBlinking)
      result = await central.blinkLEDOn({ serial: device.serial });
    else result = await central.blinkLEDOff({ serial: device.serial });

    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      let status = await central.getStatus({
        task_id: result.task_id,
      });
      if (status.state !== "QUEUED") {
        if (status.state === "SUCCESS") {
          ledBlinking = !ledBlinking;
          ledToast = f7.toast.create({
            text: `Led turned ${ledBlinking ? "on" : "off"}`,
            closeTimeout: 2000,
          });
          ledToast.open();
        }
        f7.preloader.hide();
        break;
      }
    }
  }
</script>

<Page>
  <Navbar title="Device Details" backLink="Back">
    <NavRight>
      <Link
        searchbarEnable=".searchbar-details"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
      />
    </NavRight>
    <Searchbar
      class="searchbar-details"
      expandable
      searchContainer=".search-list"
      searchIn=".item-title, .item-after"
      disableButton={!theme.aurora}
    />
  </Navbar>

  <BlockTitle>Actions</BlockTitle>
  <Block strong>
    <Row style="justify-content: normal;">
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:lightbulb"
          iconAurora="f7:lightbulb"
          iconMd="material:lightbulb"
          on:click={blinkLED}
          tooltip="Blink LED"
          text="Blink LED"
        />
      </Col>
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:gobackward"
          iconAurora="f7:gobackward"
          iconMd="material:restart_alt"
          on:click={rebootDevice}
          tooltip="Reboot Device"
          text="Reboot"
        />
      </Col>
    </Row>
  </Block>

  {#each Object.entries(device?.switch_type ? handledEntriesSwitch : device?.ap_deployment_mode ? handledEntriesAP : handledEntriesGateway) as [title, data]}
    <BlockTitle>{title}</BlockTitle>
    <List>
      {#each Object.entries(data) as [key, description]}
        {#if typeof description === "object"}
          <ListItem
            title={description.title}
            after={`${device[key]} ${description.unit}`}
          />
        {:else}
          <ListItem title={description} after={device[key]} />
        {/if}
      {/each}
    </List>
  {/each}

  <BlockTitle>All Info</BlockTitle>
  <!-- <List accordionList>
    <ListItem accordionItem title="All Info">
      <AccordionContent> -->
  <List>
    {#each Object.entries(device) as [title, data]}
      {#if !Array.isArray(data)}
        <ListItem {title} after={data} />
      {:else}
        <ListItem {title} />
        <li>
          <ul>
            {#each data as dataEntry}
              {#each Object.entries(dataEntry) as [subTitle, subData]}
                <ListItem title={subTitle} after={subData} />
              {/each}
            {/each}
          </ul>
        </li>
      {/if}
    {/each}
  </List>
  <!-- </AccordionContent>
    </ListItem>
  </List> -->
</Page>
