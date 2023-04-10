<script lang="ts">
  import { loadBoard, store_gameState } from "./board";
  import Board from "./lib/Board.svelte";
</script>

<main>
  <Board />
  {#if $store_gameState.state !== "play"}
    <div id="checkmate">{$store_gameState.reason.toUpperCase()}!</div>
    <button on:click={() => loadBoard()}> reset </button>
  {/if}
</main>
<svelte:window on:contextmenu|preventDefault />

<!-- 
  z-index order:
  0: default
  3: hoveredSqr
  5: moveOption
  7: promotion
  10: DraggedPiece
 -->
<style>
  :root {
    overflow: hidden;
  }

  #checkmate {
    z-index: 20;
    font-size: 100px;
  }
</style>
