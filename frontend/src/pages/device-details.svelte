<script>
  import {
    f7,
    f7ready,
    theme,
    Page,
    Navbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    Searchbar,
    Row,
    Col,
  } from "framework7-svelte";
  import DetailsHandler from "../components/details-handler.svelte";

  import { onMount } from "svelte";

  import { central } from "../js/central";

  import {
    blinkLEDHandler,
    rebootDeviceHandler,
  } from "../js/operations/device-operations";
  import { durationFormatter } from "human-readable";
  import { formatBytes, formatDate, formatYesNo } from "../js/formatter";
  import AutoDetailsHandler from "../components/auto-details-handler.svelte";
  import { errorToast } from "../js/operations/error-toast";

  export let device = {};
  let deviceUnhandled = {};
  export let deviceType;
  export let deviceSerial = "";

  let handledEntries = [];
  let notHandledEntries = [];

  let loaded = false;
  let loadClass = theme.ios
    ? "skeleton-text skeleton-effect-pulse"
    : "skeleton-text skeleton-effect-wave";

  onMount(() =>
    f7ready(() => {
      if (device.partial) {
        loaded = false;
      } else {
        loaded = true;
        loadClass = "";
        dataLoaded();
      }
      loadData();
    })
  );

  function loadData() {
    return central
      .ready(1)
      .then(() => {
        switch (deviceType) {
          case "IAP":
            return central.getAPDetails({ serial: deviceSerial });
          case "SWITCH":
            return central.getSwitchDetails({ serial: deviceSerial });
          case "CONTROLLER":
            return central.getGatewayDetails({ serial: deviceSerial });
        }
      })
      .then((deviceDetails) => (device = deviceDetails))
      .then(() => dataLoaded())
      .catch((e) => {
        errorToast(f7, e, { defaultTimeout: 2000 });
      })
      .finally(() => {
        loaded = true;
        loadClass = "";
      });
  }

  function dataLoaded() {
    console.log(device);
    handledEntries = Object.keys(
      Object.assign({}, ...Object.values(getHandler()))
    );
    notHandledEntries = Object.keys(device).filter(
      (n) => !handledEntries.includes(n)
    );
    if (notHandledEntries.length)
      console.log(
        "Unhandled Entries for Device",
        deviceType,
        deviceSerial,
        notHandledEntries
      );

    deviceUnhandled = Object.entries(device).reduce((obj, [key, value]) => {
      if (notHandledEntries.includes(key)) return { ...obj, [key]: value };
      return obj;
    }, {});
  }

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

  const entryGroupSiteLabel = {
    group_name: "Group Name",
    labels: "Labels",
    labels_info: "Labels",
    site: "Site",
    site_info: "Site Info",
  };
  const entryStatus = {
    status: "Status",
    uptime: { title: "Uptime", format: durationFormatter(), multiplier: 1000 },
    usage: "Usage",
    cpu_utilization: { title: "CPU", unit: "%" },
    mem_free: { title: "Mem Free", unit: "B", format: formatBytes },
    mem_total: { title: "Mem Total", unit: "B", format: formatBytes },
  };

  const entriesAP = {
    Details: {
      name: "Name",
      model: "Model",
      ip_address: "IP",
      macaddr: "MAC",
      serial: "Serial",
      firmware_version: "Firmware",
      last_modified: {
        title: "Last Modified",
        format: formatDate,
        multiplier: 1000,
      },
    },
    "Group / Site / Label": entryGroupSiteLabel,
    Status: {
      ...entryStatus,
      client_count: "Clients",
      current_uplink_inuse: "Current Uplink",
    },
    Swarm: {
      swarm_name: "Swarm Name",
      swarm_id: "Swarm Id",
      swarm_master: "Is Swarm Master?",
    },
  };
  const entriesSwitch = {
    Details: {
      name: "Name",
      model: "Model",
      switch_type: "Type",
      chassis_type: { title: "Chassis", format: formatYesNo },
      ip_address: "IP",
      macaddr: "MAC",
      serial: "Serial",
      firmware_version: "Firmware",
      updated_at: {
        title: "Updated at",
        format: formatDate,
        multiplier: 1000,
      },
    },
    "Group / Site / Label": entryGroupSiteLabel,
    Status: { ...entryStatus, total_clients: "Clients" },
  };
  const entriesGateway = {
    Details: {
      name: "Name",
      model: "Model",
      mode: "Mode",
      ip_address: "IP",
      macaddr: "MAC",
      serial: "Serial",
      firmware_version: "Firmware",
    },
    "Group / Site / Label": entryGroupSiteLabel,
    Status: { ...entryStatus, ap_count: "AP Count" },
  };

  function getHandler() {
    switch (deviceType) {
      case "IAP":
        return entriesAP;
      case "SWITCH":
        return entriesSwitch;
      case "CONTROLLER":
        return entriesGateway;
    }
    return {};
  }

  async function rebootDevice() {
    await rebootDeviceHandler(f7, device);
  }

  let ledBlinking = false;

  async function blinkLED() {
    ledBlinking = await blinkLEDHandler(f7, device.serial, ledBlinking);
  }

  async function loadMore(done) {
    loadData().then(() => done());
  }
</script>

<Page ptr onPtrRefresh={loadMore}>
  <Navbar title={device.name ? device.name : "Device Details"} backLink="Back">
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

  <DetailsHandler {getHandler} {loadClass} details={device} />

  <AutoDetailsHandler {loadClass} detailsUnhandled={deviceUnhandled} />
</Page>
