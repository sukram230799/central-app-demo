<script>
  import { BlockTitle, List, ListItem } from "framework7-svelte";

  export let loadClass;
  export let detailsUnhandled;
</script>

<BlockTitle>Further Details</BlockTitle>
<List>
  {#each Object.entries(detailsUnhandled) as [title, data]}
    {#if Array.isArray(data)}
      <ListItem class={loadClass} {title} />
      <li>
        <ul>
          {#each data as dataEntry}
            {#if !!dataEntry && typeof dataEntry === "string"}
              <ListItem class={loadClass} after={dataEntry} />
            {:else if !!dataEntry}
              {#each Object.entries(dataEntry) as [subTitle, subData]}
                <ListItem class={loadClass} title={subTitle} after={subData} />
              {/each}
            {/if}
          {/each}
        </ul>
      </li>
    {:else if data !== null && typeof data === "object"}
      <ListItem class={loadClass} {title} />
      <li>
        <ul>
          {#each Object.entries(data) as [subTitle, subData]}
            <ListItem class={loadClass} title={subTitle} after={subData} />
          {/each}
        </ul>
      </li>
    {:else}
      <ListItem class={loadClass} {title} after={data} />
    {/if}
  {/each}
</List>
