<script lang="ts">
  import { onMount } from "svelte";
  import { store_sqrPositions, store_sqrSize } from "../board";
  import { previousMove } from "../move";
  import { getHoveredSqrIndex } from "../chess";

  export let index: number;

  $: setPosition($store_sqrPositions);

  let sqrDiv: HTMLElement;
  let colorTone: string;
  let isHighlighted: boolean = false;

  $: colorType = isHighlighted
    ? "highlight"
    : $previousMove &&
      (index === $previousMove.startSqr || index === $previousMove.targetSqr)
    ? "move"
    : "";

  onMount(() => {
    colorTone = (index + Math.floor(index / 8)) % 2 !== 0 ? "dark" : "light";
    setPosition($store_sqrPositions);
  });

  function setPosition(sqrPositions: number[][]) {
    if (!sqrDiv) return;
    sqrDiv.style.left = `${sqrPositions[index][0]}px`;
    sqrDiv.style.top = `${sqrPositions[index][1]}px`;

    sqrDiv.style.width = `${$store_sqrSize}px`;
    sqrDiv.style.height = `${$store_sqrSize}px`;
  }

  function handleWindowContextMenu(e: MouseEvent) {
    const targetSqr = getHoveredSqrIndex(e.x, e.y);
    if (targetSqr !== index) return;

    isHighlighted = !isHighlighted;
  }
</script>

<svelte:window
  on:contextmenu={handleWindowContextMenu}
  on:mousedown={(e) => {
    if (e.button === 0) isHighlighted = false;
  }}
/>
<div class="square {colorTone + colorType}" bind:this={sqrDiv} />

<style>
  :root {
    --color-light: rgb(254, 238, 156);
    --color-dark: rgb(178, 184, 75);
    --color-move-light: rgb(255, 232, 59);
    --color-move-dark: rgb(200, 192, 78);
    --color-highlight-light: rgb(119, 210, 255);
    --color-highlight-dark: rgb(95, 183, 226);
  }

  .dark {
    background-color: var(--color-dark);
  }

  .light {
    background-color: var(--color-light);
  }

  .darkmove {
    background-color: var(--color-move-dark);
  }

  .lightmove {
    background-color: var(--color-move-light);
  }

  .lighthighlight {
    background-color: var(--color-highlight-light);
  }

  .darkhighlight {
    background-color: var(--color-highlight-dark);
  }

  .square {
    position: absolute;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }
</style>
