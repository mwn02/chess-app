<script lang="ts">
  import { store_sqrPositions } from "../board";
  import Square from "./Square.svelte";
</script>

<div id="squares">
  {#each $store_sqrPositions as position, index}
    <Square {index} />
  {/each}
</div>
