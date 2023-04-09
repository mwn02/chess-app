<script lang="ts">
  import {
    mainBoardState,
    store_sqrPositions,
    store_moveOptions,
    store_sqrSize,
  } from "../board";
</script>

{#each $store_moveOptions as option}
  <svg
    class="option"
    style="left: {$store_sqrPositions[
      option.targetSqr
    ][0]}; top: {$store_sqrPositions[option.targetSqr][1]};"
    width={$store_sqrSize}
    height={$store_sqrSize}
  >
    {option.targetSqr}
    {#if mainBoardState.sqrValues[option.targetSqr]}
      <mask id="maskoption" width={$store_sqrSize} height={$store_sqrSize}>
        <circle cx="50%" cy="50%" r={$store_sqrSize / 2} fill="white" />
        <circle cx="50%" cy="50%" r={$store_sqrSize / 2.5} fill="black" />
      </mask>
      <circle cx="50%" cy="50%" r="50%" mask="url(#maskoption)" />
    {:else}
      <circle cx="50%" cy="50%" r={$store_sqrSize / 6} />
    {/if}
  </svg>
{/each}

<style>
  .option {
    position: absolute;
    z-index: 5;
    fill: rgba(0, 0, 0, 0.216);
  }
</style>
