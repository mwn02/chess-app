<script lang="ts">
  import { store_sqrPositions, store_sqrSize, store_sqrValues } from "../board";
  import { getHoveredSqrIndex, isSqrOutOfBound } from "../chess";
  import { indexToVector } from "../move";

  let isMouseDown: boolean = false;

  let hoveredSqr = getHoveredSqrIndex();
  $: maskSize = $store_sqrSize / 1.15;
  $: color = isSqrOutOfBound(hoveredSqr)
    ? "dark"
    : (indexToVector[hoveredSqr][0] + indexToVector[hoveredSqr][1]) % 2 !== 0
    ? "dark"
    : "light";

  function handleWindowMouseDown() {
    if (!isSqrOutOfBound(hoveredSqr))
      if ($store_sqrValues[hoveredSqr].value) isMouseDown = true;
  }
</script>

<svelte:window
  on:mousemove={() => (hoveredSqr = getHoveredSqrIndex())}
  on:mousedown={handleWindowMouseDown}
  on:mouseup={() => (isMouseDown = false)}
/>
{#if isMouseDown && !isSqrOutOfBound(hoveredSqr)}
  <svg
    id="hoverSqr"
    style="left: {$store_sqrPositions[
      hoveredSqr
    ][0]}; top: {$store_sqrPositions[hoveredSqr][1]};"
    width={$store_sqrSize}
    height={$store_sqrSize}
  >
    <mask id="sqrmask">
      <rect height="100%" width="100%" fill="white" />
      <rect
        x={($store_sqrSize - maskSize) / 2}
        y={($store_sqrSize - maskSize) / 2}
        height={maskSize}
        width={maskSize}
        fill="black"
      />
    </mask>
    <rect height="100%" width="100%" mask="url(#sqrmask)" class={color} />
  </svg>
{/if}

<style>
  :root {
    --color-sqr-light: rgba(200, 200, 200, 0.8);
    --color-sqr-dark: rgba(138, 141, 116, 0.8);
  }

  .light {
    fill: var(--color-sqr-light);
  }

  .dark {
    fill: var(--color-sqr-dark);
  }

  #hoverSqr {
    pointer-events: none;
    position: absolute;
    z-index: 3;
  }
</style>
