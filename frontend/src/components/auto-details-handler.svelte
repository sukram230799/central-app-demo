<script>
  import { BlockTitle, List, ListItem } from "framework7-svelte";

  export let loadClass;
  export let detailsUnhandled;
</script>

<BlockTitle>Further Details</BlockTitle>
<List class="search-list">
  {#each Object.entries(detailsUnhandled) as [title, data]}
    {#if Array.isArray(data)}
      <!-- ARRAY -->
      <ListItem class={loadClass} {title} />
      <li>
        <ul>
          {#each data as dataEntry}
            {#if !!dataEntry && typeof dataEntry === "string"}
              <ListItem class={loadClass} after={dataEntry} />
            {:else if !!dataEntry}
              {#each Object.entries(dataEntry) as [subTitle, subData]}
                {#if typeof subData !== "string" || subData?.length < 30}
                  <ListItem
                    class={loadClass}
                    title={subTitle}
                    after={subData}
                  />
                {:else}
                  <ListItem
                    class={loadClass}
                    title={subTitle}
                    footer={subData}
                  />
                {/if}
              {/each}
            {/if}
          {/each}
        </ul>
      </li>
    {:else if data !== null && typeof data === "object"}
      <!-- OBJECT -->
      <ListItem class={loadClass} {title} />
      <li>
        <ul>
          {#each Object.entries(data) as [subTitle, subData]}
            {#if typeof subData !== "string" || subData?.length < 30}
              <ListItem class={loadClass} title={subTitle} after={subData} />
            {:else}
              <ListItem class={loadClass} title={subTitle} footer={subData} />
            {/if}
          {/each}
        </ul>
      </li>
    {:else}
      <!-- STRING -->
      {#if typeof data !== "string" || data?.length < 30}
        <ListItem class={loadClass} {title} after={data} />
      {:else}
        <ListItem class={loadClass} {title} footer={data} />
      {/if}
    {/if}
  {/each}
</List>
