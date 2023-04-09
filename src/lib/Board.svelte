<script lang="ts">
  import { beforeUpdate, onMount } from "svelte";
  import { init, updateAndGenerateSqrPositions } from "../board";
  import BoardPieces from "./BoardPieces.svelte";
  import BoardSquares from "./BoardSquares.svelte";
  import HoveredSqr from "./HoveredSqr.svelte";
  import MoveOptions from "./MoveOptions.svelte";

  let hasMounted: boolean = false;
  let boardDiv: HTMLElement;

  let resizeObserver = new ResizeObserver(() => {
    updateAndGenerateSqrPositions(
      boardDiv.getBoundingClientRect().width,
      getPosition()
    );
  });

  let getPosition = () => {
    let left = boardDiv.getBoundingClientRect().left;
    let top = boardDiv.getBoundingClientRect().top;
    return [left, top];
  };

  onMount(() => {
    resizeObserver.observe(boardDiv);
  });

  beforeUpdate(() => {
    if (!hasMounted) {
      let size = 800;
      init(size, [0, 0]);
      hasMounted = true;
    }
  });
</script>

<div id="board" bind:this={boardDiv}>
  <BoardSquares />
  <BoardPieces />
  <MoveOptions />
  <HoveredSqr />
</div>

<style>
  #board {
    height: 80vh;
    aspect-ratio: 1 / 1;
  }
</style>
