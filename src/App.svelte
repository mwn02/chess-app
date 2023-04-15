<script lang="ts">
  import { loadBoard, store_gameState } from "./board";
  import Board from "./lib/Board.svelte";
  import PlayOptions from "./lib/PlayOptions.svelte";
</script>

<main id="main">
  <Board />
  {#if $store_gameState.state === "play"}
    <PlayOptions />
  {:else}
    <div id="checkmate">
      {$store_gameState.reason.toUpperCase()}!
      <button on:click={() => loadBoard()}> reset </button>
    </div>
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
  #checkmate {
    z-index: 20;
    font-size: 100px;
  }

  #main {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    align-items: stretch center;
  }
</style>
