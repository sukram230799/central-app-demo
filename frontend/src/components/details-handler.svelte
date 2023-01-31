<script>
  import { BlockTitle, List, ListItem } from "framework7-svelte";
  import { unitHumanReadable } from "../js/formatter";

  export let getHandler;
  export let loadClass;
  export let details;
</script>

{#each Object.entries(getHandler()) as [title, data]}
  <BlockTitle>{title}</BlockTitle>
  <List class="search-list">
    {#each Object.entries(data) as [key, description]}
      {#if typeof description === "object"}
        <ListItem
          class={loadClass}
          title={description.title}
          href={description.href}
          routeProps={description.routeProps
            ? description.routeProps(details)
            : undefined}
          after={unitHumanReadable(
            details[key],
            description.unit,
            description.format,
            description.multiplier
          )}
        />
      {:else}
        <ListItem class={loadClass} title={description} after={details[key]} />
      {/if}
    {/each}
  </List>
{/each}
