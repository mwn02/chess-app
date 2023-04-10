<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { store_sqrPositions, store_sqrSize } from "../board";
  import { BISHOP, KNIGHT, QUEEN, ROOK } from "../chess";

  export let color: string;
  export let positionIndex: number;
  let isForWhite: boolean;

  let pieceTypesStr = ["q", "n", "r", "b"];
  let pieceTypes = [QUEEN, KNIGHT, ROOK, BISHOP];
  let promotionPanelDiv: HTMLElement;

  const dispatch = createEventDispatcher<{
    canceled: {};
    promoted: { pieceType: number };
  }>();
  let isMouseOver: boolean = true;

  onMount(() => {
    let indexX = positionIndex;
    let indexY = positionIndex;

    isForWhite = color === "w" ? true : false;
    if (!isForWhite) {
      pieceTypes = pieceTypes.reverse();
      pieceTypesStr = pieceTypesStr.reverse();
      indexY -= 24;
    }

    promotionPanelDiv.style.left = `${$store_sqrPositions[indexX][0]}px`;
    promotionPanelDiv.style.top = `${$store_sqrPositions[indexY][1]}px`;

    promotionPanelDiv.style.width = `${$store_sqrSize}px`;
    promotionPanelDiv.style.height = `${$store_sqrSize * 4}px`;
  });

  onDestroy(() => {
    window.removeEventListener("mousedown", handleMouseDown);
  });

  window.addEventListener("mousedown", handleMouseDown);

  function handleMouseDown() {
    if (!isMouseOver) dispatch("canceled");
  }

  function promote(index: number) {
    dispatch("promoted", {
      pieceType: pieceTypes[index],
    });
  }
</script>

<div
  id="promotion-panel"
  on:mouseleave={() => (isMouseOver = false)}
  on:mouseenter={() => (isMouseOver = true)}
  bind:this={promotionPanelDiv}
>
  {#each pieceTypesStr as pieceName, index}
    <div
      class="promotion-piece"
      style="background-image: url(/chess_pieces/{color}{pieceName}.svg);"
      on:mousedown={() => promote(index)}
    />
  {/each}
</div>

<style>
  #promotion-panel {
    position: absolute;
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    grid-template-columns: 1fr;
    background-color: brown;
    z-index: 7;
  }

  .promotion-piece {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-size: 100% auto;

    z-index: 5;
    scale: 1;

    transition: 100ms scale ease;
  }

  .promotion-piece:hover {
    scale: 1.2;
  }
</style>
