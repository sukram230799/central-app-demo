<script>
  export let groupTemplateInfo;
</script>

Wired: {#if groupTemplateInfo?.Wired}
<span class="badge color-gray">Template</span>
{:else}
<span class="badge color-orange">UI Group</span>
{/if} Wireless: {#if groupTemplateInfo?.Wireless}
<span class="badge color-gray">Template</span>
{:else}
<span class="badge color-orange">UI Group</span>
{/if}
