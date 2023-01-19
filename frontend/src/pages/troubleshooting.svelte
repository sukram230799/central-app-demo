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
    Searchbar,
    f7,
  } from "framework7-svelte";
  import { Central } from "../js/central";
  import {
    controllerOptions,
    iapOptions,
    masOptions,
    switchOptions,
  } from "./troubleshooting-options";

  let deviceType;
  let central = new Central();
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
  <Navbar title="About" backLink="Back">
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
      searchContainer=".search-list"
      searchIn=".item-title"
      disableButton={!theme.aurora}
    />
  </Navbar>
  <BlockTitle>Troubleshooting</BlockTitle>
  <List class="search-list">
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
  {#each optionsParsed ? Object.entries(optionsParsed) : [] as [category, data]}
    <BlockTitle>{category}</BlockTitle>
    <List>
      {#each data as command}
        <ListItem title={command.summary} href="/troubleshooting/details" routeProps={{ command }} />
      {/each}
    </List>
  {/each}
</Page>
