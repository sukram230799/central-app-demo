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
  } from "framework7-svelte";
  import { central } from "../js/central";

  export let groupName;
  export let groupProperties = {};
  export let groupTemplateInfo = {};

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
      });

  const handledEntries = {};
  let title = groupName;
  export let showAllEntries = true;

  async function cloneGroupGetName() {
    await central.ready();
    f7.dialog.prompt(
      "Please enter the name of the new group",
      "Clone Group",
      (newGroupName) => {
        if (newGroupName.length >= 0) {
          cloneGroupGetUpgrade(newGroupName);
        } else
          f7.toast.show({ text: "Name can't be empty", closeTimeout: 1000 });
      }
    );
  }

  function cloneGroupGetUpgrade(newGroupName) {
    f7.dialog
      .create({
        title: "Clone Group",
        text: "Upgrade Architecture?",
        buttons: [{ text: "Keep" }, { text: "Upgrade" }],
        onClick: (dialog, index) => {
          console.log(dialog);
          cloneGroup(newGroupName, !!index);
        },
      })
      .open();
  }

  function cloneGroup(newGroupName, upgradeArchitecture) {
    f7.preloader.show();
    central
      .cloneGroup({
        group: newGroupName,
        clone_group: groupName,
        upgrade_architecture: upgradeArchitecture,
      })
      .then((message) => f7.toast.show({ text: message, closeTimeout: 2000 }))
      .catch((e) => {
        console.log(e);
        f7.toast.show({
          text: e?.options?.responseBody?.description
            ? e.options.responseBody.description
            : JSON.stringify(e),
          closeTimeout: 8000,
        });
      })
      .finally(() => f7.preloader.hide());
  }
</script>

<Page>
  <Navbar {title} backLink="Back">
    <NavRight>
      <Link
        iconIos="f7:plus_square_on_square"
        iconAurora="f7:plus_square_on_square"
        iconMd="material:content_copy"
        on:click={cloneGroupGetName}
        tooltip="Clone Group"
      />
    </NavRight>
  </Navbar>

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
      {#each Object.entries(groupProperties) as [title, data]}
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
