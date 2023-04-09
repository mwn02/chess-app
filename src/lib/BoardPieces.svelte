<script lang="ts">
  import { store_sqrValues } from "../board";
  import Piece from "./Piece.svelte";
</script>

<div id="pieces">
  {#each $store_sqrValues as v, index (v.id)}
    {#if v.value}
      <Piece myIndex={index} />
    {/if}
  {/each}
</div>
