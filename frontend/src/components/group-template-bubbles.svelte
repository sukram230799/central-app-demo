<script>
  export let groupTemplateInfo;
</script>

Wired: {#if groupTemplateInfo?.Wired === true}
  <span class="badge color-gray">Template</span>
{:else if groupTemplateInfo?.Wired === false}
  <span class="badge color-orange">UI Group</span>
{/if} Wireless: {#if groupTemplateInfo?.Wireless === true}
  <span class="badge color-gray">Template</span>
{:else if groupTemplateInfo?.Wireless === false}
  <span class="badge color-orange">UI Group</span>
{/if}
