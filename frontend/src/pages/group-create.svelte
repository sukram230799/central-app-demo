<script>
  import {
    f7,
    f7ready,
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    List,
    ListInput,
    ListItem,
    Toggle,
    NavRight,
    Link,
  } from "framework7-svelte";
  import { central } from "../js/central";

  let subscriptions = [];
  import { groupStore } from "../js/svelte-store";

  export let groupName = "";
  export let oldGroupName = "";
  export let oldGroupDetails = {};
  export let edit = false;

  let templateWireless = false;
  let templateWired = false;

  let allowAPs = true;
  let allowGWs = true;
  let architecture = "AOS10";

  let apNetworkRole = "Standard";
  let gwNetworkRole = "BranchGateway";

  let allowAOS_S = true;
  let allowAOS_CX = true;

  let monitorAOS_S = false;
  let monitorAOS_CX = false;

  $: if (allowAPs && apNetworkRole === "Microbranch") allowGWs = false;
  // $: if (allowGWs && gwNetworkRole === "VPNC") allowAPs = false;
  $: if (architecture === "Instant") gwNetworkRole = "BranchGateway";
  $: if (architecture !== "AOS10") apNetworkRole = "Standard";

  if (edit) loadUpdateGroupDetails();

  function loadUpdateGroupDetails() {
    console.log(oldGroupDetails);
    try {
      groupName = oldGroupName;

      templateWireless = oldGroupDetails.Wireless;
      templateWired = oldGroupDetails.Wired;

      allowAPs = oldGroupDetails.AllowedDevTypes.includes("AccessPoints");
      allowGWs = oldGroupDetails.AllowedDevTypes.includes("Gateways");

      architecture = oldGroupDetails.Architecture;

      apNetworkRole = oldGroupDetails.ApNetworkRole;
      gwNetworkRole = oldGroupDetails.GwNetworkRole;

      allowAOS_S = oldGroupDetails.AllowedSwitchTypes.includes("AOS_S");
      allowAOS_CX = oldGroupDetails.AllowedSwitchTypes.includes("AOS_CX");

      monitorAOS_S = oldGroupDetails.MonitorOnly.includes("AOS_S");
      monitorAOS_CX = oldGroupDetails.MonitorOnly.includes("AOS_CX");
    } catch (e) {
      f7.toast.show({
        text: "Couldn't load group details",
        closeTimeout: 2000,
      });
    }
  }

  function getGroupDetails() {
    if (!groupName) {
      f7.toast.show({
        text: "Group Name can't be empty",
        closeTimeout: 2000,
      });
      return null;
    }

    if (allowGWs && gwNetworkRole === "VPNConcentrator" && allowAPs) {
      f7.toast.show({
        text: "Access points cannot be present in a group with VPN concentrator network role set for Gateways",
        closeTimeout: 2000,
      });
      return null;
    }

    let allowedDevTypes = [];
    if (allowAPs) allowedDevTypes.push("AccessPoints");
    else apNetworkRole = undefined;

    if (allowGWs) allowedDevTypes.push("Gateways");
    else gwNetworkRole = undefined;

    if (allowAOS_S || allowAOS_CX) allowedDevTypes.push("Switches");

    let allowedSwitchTypes = [];
    if (allowAOS_S) allowedSwitchTypes.push("AOS_S");
    if (allowAOS_CX) allowedSwitchTypes.push("AOS_CX");

    let monitorOnly = [];
    if (allowAOS_S && monitorAOS_S) monitorOnly.push("AOS_S");
    if (allowAOS_CX && monitorAOS_CX) monitorOnly.push("AOS_CX");

    const details = {
      group: groupName,
      group_attributes: {
        template_info: {
          Wired: templateWired,
          Wireless: templateWireless,
        },
        group_properties: {
          Architecture: allowAPs || allowGWs ? architecture : undefined,
          AllowedDevTypes: allowedDevTypes,
          AllowedSwitchTypes: allowedSwitchTypes,
          MonitorOnly: monitorOnly,
          ApNetworkRole: apNetworkRole,
          GwNetworkRole: gwNetworkRole,
        },
      },
    };
    return details;
  }

  function updateGroup() {
    const details = getGroupDetails();
    if (details === null) return;

    console.log(details);
    console.log(oldGroupDetails);

    central
      .ready(1)
      .then(() => f7.preloader.show())
      .then(() =>
        central.updateGroupProperties({
          groupName: oldGroupName,
          groupDetails: details,
        })
      )
      .then((message) => {
        f7.toast.show({ text: message, closeTimeout: 2000 });
        groupCreated();
      })
      .catch((e) => {
        console.error(e);
        f7.toast.show({
          text: e?.options?.responseBody?.description
            ? e.options.responseBody.description
            : JSON.stringify(e),
          closeTimeout: 2000,
        });
        groupFailed();
      })
      .then(() => {
        if (groupName !== oldGroupName)
          return central.updateGroupName({
            oldGroupName,
            newGroupName: groupName,
          });
      })
      .then((message) => {
        f7.toast.show({ text: message, closeTimeout: 2000 });
        groupCreated();
      })
      .catch((e) => {
        console.error(e);
        f7.toast.show({
          text: e?.options?.responseBody?.description
            ? e.options.responseBody.description
            : JSON.stringify(e),
          closeTimeout: 2000,
        });
        groupFailed();
      })
      .finally(() => {
        f7.preloader.hide();
      });
  }

  function createGroup() {
    const details = getGroupDetails();
    if (details === null) return;

    console.log(details);
    console.log(JSON.stringify(details, null, 2));
    central
      .ready(1)
      .then(() => f7.preloader.show())
      .then(() => central.createGroupProperties({ groupDetails: details }))
      .then((message) => {
        f7.toast.show({ text: message, closeTimeout: 2000 });
        groupCreated();
      })
      .catch((e) => {
        console.error(e);
        f7.toast.show({
          text: e?.options?.responseBody?.description
            ? e.options.responseBody.description
            : JSON.stringify(e),
          closeTimeout: 2000,
        });
        groupFailed();
      })
      .finally(() => {
        f7.preloader.hide();
      });
  }

  function groupCreated() {
    groupStore.add(groupName);
  }

  function done() {
    if (edit) updateGroup();
    else createGroup();
  }

  function groupFailed() {}
</script>

<Page>
  <Navbar title={edit ? "Edit Group" : "Create Group"} backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:checkmark_alt"
        iconAurora="f7:checkmark_alt"
        iconMd="material:done"
        on:click={done}
      />
    </NavRight>
  </Navbar>
  <BlockTitle>Group Details</BlockTitle>
  <List>
    <ListInput
      type="text"
      label="Name"
      placeholder="Group Name"
      bind:value={groupName}
    />
    <ListItem>
      <span>Template Wireless</span>
      <Toggle bind:checked={templateWireless} />
    </ListItem>
    <ListItem>
      <span>Template Wired</span>
      <Toggle bind:checked={templateWired} />
    </ListItem>
    {#if allowAPs || allowGWs}
      <ListInput
        label="Architecture"
        type="select"
        bind:value={architecture}
        placeholder="Please choose..."
      >
        <option value="Instant">Instant / AOS8</option>
        <option value="AOS10">AOS10</option>
      </ListInput>
    {/if}
  </List>
  <BlockTitle>Access Points</BlockTitle>
  <List>
    <ListItem>
      <span>Acceess Points</span>
      <Toggle bind:checked={allowAPs} />
    </ListItem>
    {#if allowAPs && architecture === "AOS10"}
      <ListInput
        label="AP Network Role"
        type="select"
        bind:value={apNetworkRole}
        placeholder="Please choose..."
      >
        <option value="Standard">Standard</option>
        {#if architecture === "AOS10"}
          <option value="Microbranch">Microbranch</option>
        {/if}
      </ListInput>
    {/if}
  </List>
  <BlockTitle>Gateways</BlockTitle>
  <List>
    <ListItem disabled={allowAPs && apNetworkRole === "Microbranch"}>
      <span>Gateways</span>
      <Toggle
        disabled={allowAPs && apNetworkRole === "Microbranch"}
        bind:checked={allowGWs}
      />
    </ListItem>
    {#if allowGWs}
      <ListInput
        label="GW Network Role"
        type="select"
        bind:value={gwNetworkRole}
        placeholder="Please choose..."
      >
        <option value="BranchGateway">Branch Gateway</option>
        <option value="VPNConcentrator">VPN Concentrator</option>
        {#if architecture === "AOS10"}
          <option value="WLANGateway">WLAN Gateway</option>
        {/if}
      </ListInput>
    {/if}
  </List>
  <BlockTitle>Switches</BlockTitle>
  <List>
    <ListItem>
      <span>AOS-S Switch</span>
      <Toggle bind:checked={allowAOS_S} />
    </ListItem>
    {#if allowAOS_S}
      <ListItem>
        <span>Monitor AOS-S Switch</span>
        <Toggle bind:checked={monitorAOS_S} />
      </ListItem>
    {/if}
    <ListItem>
      <span>AOS-CX Switch</span>
      <Toggle bind:checked={allowAOS_CX} />
    </ListItem>
    {#if allowAOS_CX}
      <ListItem>
        <span>Monitor AOS-CX Switch</span>
        <Toggle bind:checked={monitorAOS_CX} />
      </ListItem>
    {/if}
  </List>
</Page>
