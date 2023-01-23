<script>
  import {
    f7,
    f7ready,
    Page,
    Navbar,
    BlockTitle,
    List,
    ListItem,
    NavRight,
    Link,
    Block,
  } from "framework7-svelte";
  import { central } from "../js/central";
  import {
    cloneGroupGetName,
    deleteGroupDialog,
  } from "../components/group-operations";
  import GroupTemplateBubbles from "../components/group-template-bubbles.svelte";
  import GroupPropertiesBubbles from "../components/group-properties-bubbles.svelte";

  export let f7router;
  export let groupName;
  export let groupProperties = {};
  export let groupTemplateInfo = {};

  let groupDetails = { ...groupProperties, template: groupTemplateInfo };

  if (
    // https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    groupProperties && // 👈 null and undefined check
    Object.keys(groupProperties).length === 0 &&
    Object.getPrototypeOf(groupProperties) === Object.prototype
  )
    central
      .ready(1)
      .then(() => central.getPropertiesOfGroups({ groups: [groupName] }))
      .then((propertiesResponse) => {
        groupProperties = propertiesResponse.data[0].properties;
        console.log(groupProperties);
      })
      .then(() => central.getGroupTemplateInfo({ groups: [groupName] }))
      .then((templateInfoResponse) => {
        templateInfo = templateInfoResponse.data[0].properties;
        console.log(templateInfo);
      });

  const handledEntries = {};
  let title = groupName;
  export let showAllEntries = true;

  async function cloneGroup() {
    cloneGroupGetName(f7, groupCloned, groupName);
  }

  function groupCloned() {}

  async function deleteGroup() {
    deleteGroupDialog(f7, groupDelted, groupName);
  }

  function groupDelted() {
    f7router.back();
  }
</script>

<Page>
  <Navbar {title} backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:plus_square_on_square"
        iconAurora="f7:plus_square_on_square"
        iconMd="material:content_copy"
        on:click={cloneGroup}
        tooltip="Clone Group"
      />
      <Link
        iconIos="f7:trash"
        iconAurora="f7:trash"
        iconMd="material:delete_forever"
        on:click={deleteGroup}
        tooltip="Delete Group"
      />
    </NavRight>
  </Navbar>
  <BlockTitle>Group Info</BlockTitle>
  <List>
    <ListItem>
      <span>
        <GroupTemplateBubbles {groupTemplateInfo} />
      </span>
    </ListItem>
    <ListItem>
      <span
        >Properties:
        <GroupPropertiesBubbles {groupProperties} />
      </span>
    </ListItem>
  </List>
  <Block />

  {#each Object.entries(handledEntries) as [title, data]}
    <BlockTitle>{title}</BlockTitle>
    <List>
      {#each Object.entries(data) as [key, description]}
        {#if typeof description === "object"}
          <ListItem
            title={description.title}
            after={`${groupProperties[key]} ${description.unit}`}
          />
        {:else}
          <ListItem title={description} after={groupProperties[key]} />
        {/if}
      {/each}
    </List>
  {/each}

  {#if showAllEntries}
    <BlockTitle>All Info</BlockTitle>

    <List>
      {#each Object.entries(groupDetails) as [title, data]}
        {#if !Array.isArray(data)}
          <ListItem {title} after={data} />
        {:else}
          <ListItem title={`${title}:`} />
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
