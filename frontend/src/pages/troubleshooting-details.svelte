<script>
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
  } from "framework7-svelte";

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

  let serialNumber;
  let argumentValues = [];
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
      bind:value={serialNumber}
    >
      <select name="devcie">
        <option>SN102030 Name</option>
        <option>SN102030 otherName</option>
      </select>
    </ListItem>
  </List>
  <Block strong>
    <Button raised fill>Run</Button>
  </Block>
  <BlockTitle>Status</BlockTitle>
  <Block />
</Page>
