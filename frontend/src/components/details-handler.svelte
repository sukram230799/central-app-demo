<script>
  import { BlockTitle, List, ListItem } from "framework7-svelte";
  import { unitHumanReadable } from "../js/formatter";

  export let getHandler;
  export let loadClass;
  export let details;
</script>

{#each Object.entries(getHandler()) as [title, data]}
  <BlockTitle>{title}</BlockTitle>
  <List mediaList class="search-list">
    {#each Object.entries(data) as [key, description]}
      {#if typeof description === "object"}
        {#if description.suppress}
          <!---->
        {:else if description.asTitle}
          <ListItem
            class={loadClass}
            title={unitHumanReadable(
              details[key],
              description.unit,
              description.format,
              description.multiplier
            )}
            href={description.href}
            routeProps={description.routeProps
              ? description.routeProps(details)
              : undefined}
            mediaItem={true}
          />
        {:else if description.asFooter}
          <ListItem
            class={loadClass}
            title={description.title}
            href={description.href}
            routeProps={description.routeProps
              ? description.routeProps(details)
              : undefined}
            footer={unitHumanReadable(
              details[key],
              description.unit,
              description.format,
              description.multiplier
            )}
          />
        {:else if description.asText}
          <ListItem
            class={loadClass}
            title={description.title}
            href={description.href}
            routeProps={description.routeProps
              ? description.routeProps(details)
              : undefined}
            text={unitHumanReadable(
              details[key],
              description.unit,
              description.format,
              description.multiplier
            )}
          />
        {:else}
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
        {/if}
      {:else}
        <ListItem class={loadClass} title={description} after={details[key]} />
      {/if}
    {/each}
  </List>
{/each}
