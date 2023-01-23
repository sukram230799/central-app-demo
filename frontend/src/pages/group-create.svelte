<script>
  import {
    f7,
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
  import { groupStore } from "../js/svelte-store";

  export let f7router;

  let groupName = "";

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

  $: if (apNetworkRole === "Microbranch") allowGWs = false;
  $: if (architecture === "Instant") gwNetworkRole = "BranchGateway";
  $: if (architecture !== "AOS10") apNetworkRole = "Standard";

  function createGroup() {
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
        console.log(e);
        f7.toast.show({
          text: e?.options?.responseBody?.description
            ? e.options.responseBody.description
            : JSON.stringify(e),
          closeTimeout: 8000,
        });
        groupFailed();
      })
      .finally(() => {
        f7.preloader.hide();
      });
  }

  function groupCreated() {
    groupStore.add(groupName);
    // f7router.back();
  }

  function groupFailed() {}
</script>

<Page>
  <Navbar title="Create Group" backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:checkmark_alt"
        iconAurora="f7:checkmark_alt"
        iconMd="material:done"
        on:click={createGroup}
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
      <span>Template Wireless</span>
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
    <ListItem disabled={apNetworkRole === "Microbranch"}>
      <span>Gateways</span>
      <Toggle
        disabled={apNetworkRole === "Microbranch"}
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
        <option value="BranchGateway">BranchGateway</option>
        <option value="VPNConcentrator">VPNConcentrator</option>
        {#if architecture === "AOS10"}
          <option value="WLANGateway">WLANGateway</option>
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