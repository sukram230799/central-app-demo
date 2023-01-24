<script>
  export let groupProperties;
</script>

<!-- AOS8 or AOS10-->
{#if groupProperties?.AOSVersion === "AOS_8X"}
  <span class="badge color-teal">AOS8</span>
{:else if groupProperties?.AOSVersion === "AOS_10X"}
  <span class="badge color-orange">AOS10</span>
  <!-- AP Type -->
  {#if groupProperties?.ApNetworkRole === "Standard"}
    <span class="badge color-gray">Campus AP</span>
  {:else if groupProperties?.ApNetworkRole === "Microbranch"}
    <span class="badge color-gray">Microbranch</span>
  {/if}
{/if}
<!-- Gateway Type -->
{#if groupProperties?.GwNetworkRole === "BranchGateway"}
  <span class="badge color-gray">Branch Gateway</span>
{:else if groupProperties?.GwNetworkRole === "WLANGateway"}
  <span class="badge color-gray">Mobility Gateway</span>
{:else if groupProperties?.GwNetworkRole === "VPNConcentrator"}
  <span class="badge color-gray">VPNC</span>
{/if}
<!--  Switch Type -->
{#if groupProperties?.AllowedSwitchTypes.includes("AOS_CX")}
  <span class="badge color-gray">AOS-CX</span>
{/if}
{#if groupProperties?.AllowedSwitchTypes.includes("AOS_S")}
  <span class="badge color-gray">AOS-S</span>
{/if}
{#if groupProperties?.MonitorOnlySwitch}
  <span class="badge color-gray">Monitor-Only</span>
{/if}
