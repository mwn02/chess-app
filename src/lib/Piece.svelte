<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    store_sqrPositions,
    store_moveOptions,
    store_sqrValues,
    store_sqrSize,
    mainBoardState,
  } from "../board";
  import {
    extractFromValue,
    BISHOP,
    KING,
    KNIGHT,
    PAWN,
    QUEEN,
    ROOK,
    isSqrOutOfBound,
    getHoveredSqrIndex,
  } from "../chess";
  import { makeMove, moves, type move } from "../move";
  import Promotion from "./Promotion.svelte";

  export let myIndex: number;

  let pieceDiv: HTMLElement;
  let fileName: string;
  let hasMounted: boolean = false;
  let colorStr: string = "w";
  let color: number;
  let isWhite: boolean;

  let isMoving: boolean;
  let isSelected: boolean;
  let selectionCount: number = 0; // number of time the piece is being selected

  $: setPosition(myIndex, $store_sqrPositions);
  $: setSize($store_sqrSize);

  let promotion: {
    isPromoting: boolean;
    positionIndex: number;
    moves: move[];
  } = {
    isPromoting: false,
    positionIndex: 0,
    moves: [null],
  };

  let pieceTypeToStr: { [num: number]: string } = {
    [KING]: "k",
    [PAWN]: "p",
    [KNIGHT]: "n",
    [BISHOP]: "b",
    [ROOK]: "r",
    [QUEEN]: "q",
  };

  onMount(() => {
    hasMounted = true;
    initDrag();
    initVisual();
  });

  let unsubscribe = store_sqrValues.subscribe(() => {
    if (hasMounted) initVisual();
  });

  onDestroy(() => unsubscribe());

  function initVisual() {
    let [pieceType, _color, _isWhite] = extractFromValue(
      $store_sqrValues[myIndex].value
    );

    color = _color;
    isWhite = _isWhite;

    colorStr = isWhite ? "w" : "b";
    let pieceStr = pieceTypeToStr[pieceType];

    fileName = colorStr + pieceStr;

    setSize($store_sqrSize);
    setPosition(myIndex);

    pieceDiv.style.backgroundImage = `url(/chess_pieces/${fileName}.svg)`;
  }

  function setSize($store_sqrSize: number) {
    if (!pieceDiv) return;
    pieceDiv.style.width = `${$store_sqrSize}px`;
    pieceDiv.style.height = `${$store_sqrSize}px`;
  }

  function initDrag() {
    pieceDiv.style.position = "absolute";
    pieceDiv.style.cursor = "grab";
    pieceDiv.style.userSelect = "none";
  }

  function handlePieceMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    isMoving = true;
    isSelected = true;

    pieceDiv.style.left = `${e.clientX - $store_sqrSize / 2}px`;
    pieceDiv.style.top = `${e.clientY - $store_sqrSize / 2}px`;
    pieceDiv.style.cursor = "grabbing";
    pieceDiv.style.zIndex = "10";
    store_moveOptions.set(moves.filter((m) => m.startSqr === myIndex));
  }

  function handleWindowMouseMove(e: MouseEvent) {
    if (isMoving) {
      pieceDiv.style.left = `${e.clientX - $store_sqrSize / 2}px`;
      pieceDiv.style.top = `${e.clientY - $store_sqrSize / 2}px`;
    }
  }

  function handleWindowMouseUp(e: MouseEvent) {
    pieceDiv.style.zIndex = "0";
    if (!isMoving) return;

    isMoving = false;
    pieceDiv.style.cursor = "grab";

    let targetSqr = getHoveredSqrIndex(e.clientX, e.clientY);
    let move: move = { startSqr: myIndex, targetSqr };
    attemptMakeMove(move);
  }

  function handleWindowMouseDown(e: MouseEvent) {
    if (e.button !== 0) {
      isSelected = false;
      selectionCount = 0;
      store_moveOptions.set([]);
      return;
    }

    if (!isSelected || isWhite !== mainBoardState.isTurnToWhite) return;

    let targetSqr = getHoveredSqrIndex(e.clientX, e.clientY);

    if (targetSqr === myIndex) {
      selectionCount++;

      if (selectionCount < 2) return;
    }

    isSelected = false;

    let move: move = { startSqr: myIndex, targetSqr };

    if (
      isSqrOutOfBound(targetSqr) ||
      !$store_sqrValues[targetSqr].value ||
      (selectionCount > 1 && !$store_sqrValues[targetSqr].value)
    ) {
      selectionCount = 0;
      store_moveOptions.set([]);
    }

    attemptMakeMove(move);
  }

  function attemptMakeMove(move: move) {
    if (
      moves.some(
        (m) => m.startSqr === move.startSqr && m.targetSqr === move.targetSqr
      )
    ) {
      move = moves.find(
        (m) => m.startSqr === move.startSqr && m.targetSqr === move.targetSqr
      );
      if (move.promotion) {
        promotion = {
          isPromoting: true,
          positionIndex: move.targetSqr,
          moves: moves.filter(
            (m) =>
              m.startSqr === move.startSqr && m.targetSqr === move.targetSqr
          ),
        };

        myIndex = move.targetSqr;
        return;
      }

      store_moveOptions.set([]);
      makeMove(move);
      myIndex = move.targetSqr;
      return;
    }

    setPosition(myIndex);
  }

  function setPosition(index: number, sqrPositions = $store_sqrPositions) {
    if (!pieceDiv) return;
    myIndex = index;

    pieceDiv.style.left = `${sqrPositions[index][0]}px`;
    pieceDiv.style.top = `${sqrPositions[index][1]}px`;
  }

  function handlePromotion(event: CustomEvent<{ pieceType: number }>) {
    promotion.isPromoting = false;

    const piece = event.detail.pieceType + color;
    let move = promotion.moves.find((m) => m.promotion === piece);
    makeMove(move);
    myIndex = move.targetSqr;
  }

  function handleCancelPromotion() {
    promotion.isPromoting = false;
    myIndex = promotion.moves[0].startSqr;
  }
</script>

<svelte:window
  on:mouseup={handleWindowMouseUp}
  on:mousemove={handleWindowMouseMove}
  on:mousedown={handleWindowMouseDown}
/>
<div class="piece" on:mousedown={handlePieceMouseDown} bind:this={pieceDiv} />
{#if promotion.isPromoting}
  <Promotion
    on:promoted={handlePromotion}
    on:canceled={handleCancelPromotion}
    color={colorStr}
    positionIndex={promotion.positionIndex}
  />
{/if}

<style>
  .piece {
    position: absolute;
    display: inline;
    background-repeat: no-repeat;
    background-size: 100% auto;
  }
</style>
