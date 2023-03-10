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
    Row,
    Col,
  } from "framework7-svelte";
  import { central } from "../js/central";
  import {
    cloneGroupGetName,
    deleteGroupDialog,
  } from "../js/operations/group-operations";
  import GroupTemplateBubbles from "../components/group-template-bubbles.svelte";
  import GroupPropertiesBubbles from "../components/group-properties-bubbles.svelte";

  export let f7router;
  export let groupName;
  export let groupProperties = {};
  export let groupTemplateInfo = {};

  let groupDetails = {
    ...groupProperties,
    TemplateWired: groupTemplateInfo.Wired,
    TemplateWireless: groupTemplateInfo.Wireless,
  };

  if (
    (groupProperties &&
      Object.keys(groupProperties).length === 0 &&
      Object.getPrototypeOf(groupProperties) === Object.prototype) ||
    (groupTemplateInfo &&
      Object.keys(groupTemplateInfo).length === 0 &&
      Object.getPrototypeOf(groupTemplateInfo) === Object.prototype)
  )
    central.ready(2).then(() => loadData());

  async function loadData() {
    await Promise.all([loadTemplateInfo(), loadGroupProperties()]);
    groupDetails = {
      ...groupProperties,
      TemplateWired: groupTemplateInfo.Wired,
      TemplateWireless: groupTemplateInfo.Wireless,
    };
  }

  async function loadTemplateInfo() {
    const templateInfoResponse = await central.getGroupTemplateInfo({
      groups: [groupName],
    });
    groupTemplateInfo = templateInfoResponse.data[0].template_details;
  }

  async function loadGroupProperties() {
    const propertiesResponse = await central.getPropertiesOfGroups({
      groups: [groupName],
    });
    groupProperties = propertiesResponse.data[0].properties;
  }

  const entriesGroup = {};
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
  <Navbar {title} backLink="Back" />
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
  <BlockTitle>Actions</BlockTitle>
  <Block strong>
    <Row style="justify-content: normal;">
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:pencil"
          iconAurora="f7:pencil"
          iconMd="material:edit"
          tooltip="Edit Group"
          href="/groups/create/"
          routeProps={{
            groupName: groupName,
            oldGroupName: groupName,
            oldGroupDetails: groupDetails,
            edit: true,
          }}
          text="Edit"
        />
      </Col>
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:plus_square_on_square"
          iconAurora="f7:plus_square_on_square"
          iconMd="material:content_copy"
          on:click={cloneGroup}
          tooltip="Clone Group"
          text="Clone"
        />
      </Col>
      <Col style="display:flex; justify-content: center;">
        <Link
          iconIos="f7:trash"
          iconAurora="f7:trash"
          iconMd="material:delete_forever"
          on:click={deleteGroup}
          tooltip="Delete Group"
          text="Delete"
        />
      </Col>
    </Row>
  </Block>

  {#each Object.entries(entriesGroup) as [title, data]}
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
