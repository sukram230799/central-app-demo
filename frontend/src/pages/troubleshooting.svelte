<script>
  import {
    theme,
    Page,
    Navbar,
    NavRight,
    Block,
    BlockTitle,
    BlockHeader,
    Link,
    List,
    ListItem,
    ListGroup,
    Searchbar,
    f7,
    ListIndex,
  } from "framework7-svelte";
  import { central } from "../js/central";
  import {
    controllerOptions,
    iapOptions,
    masOptions,
    switchOptions,
  } from "./troubleshooting-options";

  let deviceType = "";
  let options;
  let optionsParsed;

  async function loadOptions() {
    if (!deviceType) return;

    switch (deviceType) {
      case "IAP":
        options = iapOptions;
        break;
      case "MAS":
        options = masOptions;
        break;
      case "SWITCH":
        options = switchOptions;
        break;
      case "CONTROLLER":
        options = controllerOptions;
        break;
    }

    optionsParsed = options.commands.reduce((accu, currentValue) => {
      if (!accu) accu = [];
      if (!accu[currentValue.category]) accu[currentValue.category] = [];
      accu[currentValue.category].push(currentValue);
      return accu;
    }, []);
    console.log(deviceType, optionsParsed);

    f7.preloader.hide();
  }

  async function onDeviceTypeChange() {
    f7.preloader.show();
    setTimeout(loadOptions, 100);
  }
</script>

<Page>
  <Navbar title="Troubleshooting" backLink="Back">
    <NavRight>
      <Link
        searchbarEnable=".serachbar-troubleshooting"
        iconIos="f7:search"
        iconAurora="f7:search"
        iconMd="material:search"
      />
    </NavRight>
    <Searchbar
      class="serachbar-troubleshooting"
      expandable
      placeholder="Search Troubleshooting"
      searchContainer=".troubleshooting-options-list"
      searchIn=".item-title"
      disableButton={!theme.aurora}
    />
  </Navbar>
  <BlockTitle>Options</BlockTitle>
  <List>
    <ListItem
      title="Device Type"
      smartSelect
      smartSelectParams={{ openIn: "sheet" }}
    >
      <select
        name="device-type"
        bind:value={deviceType}
        on:change={() => onDeviceTypeChange()}
      >
        <option value="IAP">Access Point</option>
        <option value="MAS">MAS Switch</option>
        <option value="SWITCH">Switch</option>
        <option value="CONTROLLER">Controller</option>
      </select>
    </ListItem>
  </List>

  {#if !!optionsParsed}
    <BlockTitle>Troubleshooting Commands</BlockTitle>
  {/if}
  <!-- <ListIndex
      init={!!optionsParsed}
      indexes={optionsParsed ? Object.keys(optionsParsed).map((name) => name[0]) : []}
      listEl=".troubleshooting-options-list"
      scrollList={true}
      label={true}
    /> -->
  <List class="troubleshooting-options-list" ul={false}>
    {#each optionsParsed ? Object.entries(optionsParsed) : [] as [category, data]}
      <ListGroup>
        <ListItem title={category} groupTitle />
        {#each data as command}
          <ListItem
            title={command.summary}
            routeProps={{ command, deviceType }}
            href="/troubleshooting/details"
          />
          <!---->
        {/each}
      </ListGroup>
    {/each}
  </List>
</Page>
