<script>
  import {
    f7,
    f7ready,
    Page,
    Navbar,
    BlockTitle,
    List,
    ListItem,
  } from "framework7-svelte";
  import { Central } from "../js/central";

  export let groupName;
  let properties = {};

  const central = new Central();
  central
    .ready()
    .then(() => central.getPropertiesOfGroups({ groups: [groupName] }))
    .then((propertiesResponse) => {
      properties = propertiesResponse.data[0].properties;
      console.log(properties);
    });

  const handledEntries = {};
  let title = groupName;
  export let showAllEntries = true;
</script>

<Page>
  <Navbar {title} backLink="Back" />

  {#each Object.entries(handledEntries) as [title, data]}
    <BlockTitle>{title}</BlockTitle>
    <List>
      {#each Object.entries(data) as [key, description]}
        {#if typeof description === "object"}
          <ListItem
            title={description.title}
            after={`${properties[key]} ${description.unit}`}
          />
        {:else}
          <ListItem title={description} after={properties[key]} />
        {/if}
      {/each}
    </List>
  {/each}

  {#if showAllEntries}
    <BlockTitle>All Info</BlockTitle>

    <List>
      {#each Object.entries(properties) as [title, data]}
        {#if !Array.isArray(data)}
          <ListItem {title} after={data} />
        {:else}
          <ListItem {title} />
          <li>
            <ul>
              {#if !data.length}
                <ListItem />
              {/if}
              {#each data as dataEntry}
                {#if typeof dataEntry === "string"}
                  <ListItem after={dataEntry} />
                {:else}
                  {#each Object.entries(dataEntry) as [subTitle, subData]}
                    <ListItem title={subTitle} after={subData} />
                  {/each}
                {/if}
              {/each}
            </ul>
          </li>
        {/if}
      {/each}
    </List>
  {/if}
</Page>
