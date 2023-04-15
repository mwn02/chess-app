<script lang="ts">
  import {
    loadBoard,
    type gameMode,
    setGameMode,
    store_cpuMoveSpeed,
  } from "../board";

  let gameMode: gameMode = "pvp";
  let playWithWhite: boolean = true;
  let cpuMoveSpeed: number = 100;
  $: store_cpuMoveSpeed.set(cpuMoveSpeed);

  function play() {
    setGameMode(gameMode);
    loadBoard(undefined, playWithWhite);
  }
</script>

<form id="player-options" on:submit|preventDefault={play}>
  <label for="game-mode">Game mode</label>
  <select name="selection" id="game-mode" bind:value={gameMode}>
    <option value="pvp" selected>Player vs Player</option>
    <option value="pvc">Player vs Computer</option>
    <option value="cvc">Computer vs Computer</option>
  </select>

  <label for="play-white"
    ><input
      type="checkbox"
      id="play-white"
      aria-checked="true"
      bind:checked={playWithWhite}
    />Play as white</label
  >

  <button id="submit" type="submit">Play</button>
  {#if gameMode === "cvc"}
    <input
      type="range"
      name="cpu-move-speed"
      id="cpu-move-speed"
      bind:value={cpuMoveSpeed}
      min="0"
      max="2000"
    />
  {/if}
</form>

<style>
  :root {
    font-family: "Outfit", sans-serif;
    --color-grey: rgb(73, 73, 73);
  }

  label {
    font-size: 2rem;
  }

  option,
  select,
  button {
    font-size: 1rem;
    border-radius: 0.5rem;
    border: 2px solid var(--color-grey);
    font-family: "Outfit", sans-serif;
  }

  #player-options {
    padding: 20px;
    background-color: rgb(255, 226, 79);
    border-radius: 1rem;
    border: 0.5rem solid var(--color-grey);

    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  #submit {
    background-color: rgb(204, 108, 255);
    aspect-ratio: 1 / 0.3;
    font-size: 1.5rem;
  }
</style>
