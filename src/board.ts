import { get, writable, type Writable } from "svelte/store";
import { BoardState } from "./boardState";
import {
  BISHOP,
  BLACK,
  converNumArrayToSqrValues,
  KING,
  KNIGHT,
  NULL,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
} from "./chess";
import {
  generateIndexToVector,
  generateMoves,
  generateNumSqrsToEdge,
  type gameState,
  type move,
  previousMove,
  setMoves,
} from "./move";
import computer from "./computer";
import { makeMove } from "./move";

export type sqrValue = { id: number; value: number };
export const INITIAL_POSITION: string =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export let store_sqrPositions: Writable<number[][]> = writable([]);
export let store_sqrValues: Writable<sqrValue[]> = writable([]);
export let store_moveOptions: Writable<move[]> = writable([]);
export let store_sqrSize: Writable<number> = writable(0);
export let store_gameState: Writable<gameState> = writable({
  state: "play",
  reason: "none",
});
export let store_cpuMoveSpeed: Writable<number> = writable(200);
export let boardOrigin: number[] = [0, 0];

let charToPiece = {
  k: KING,
  p: PAWN,
  n: KNIGHT,
  b: BISHOP,
  r: ROOK,
  q: QUEEN,
};

export let mainBoardState: BoardState;

export type gameMode = "pvp" | "pvc" | "cvc";
export let boardGameMode: gameMode = "pvp";
export function setGameMode(_gameMode: gameMode) {
  boardGameMode = _gameMode;
}
export let isPlayerWhite: boolean;

export function init(boardSize: number, origin: number[]) {
  updateAndGenerateSqrPositions(boardSize, origin);
  loadBoard();
}

export function loadBoard(position?: string, isTurnToWhite?: boolean) {
  mainBoardState = new BoardState();
  mainBoardState.enPassant = {
    isPossible: false,
    columnNumber: -1,
  };
  mainBoardState.tripleRep = [];
  mainBoardState.fiftyMove = 0;

  loadFEN(position || INITIAL_POSITION, mainBoardState);
  if (isTurnToWhite !== undefined) isPlayerWhite = isTurnToWhite;

  previousMove.set(null);

  generateNumSqrsToEdge();
  generateIndexToVector();

  let test: boolean = false;

  if (test) {
    mainBoardState.isTurnToWhite = false;
    console.log(posTest(1));
  } else {
    newTurn(true, mainBoardState);
    store_sqrValues.set(converNumArrayToSqrValues(mainBoardState.sqrValues));
  }
}

function posTest(depth: number): number {
  if (depth === 0) return 1;

  let numPosition: number = 0;

  let [, moves] = generateMoves(mainBoardState);
  let sqrValues = structuredClone(mainBoardState.sqrValues);

  moves.forEach((move) => {
    makeMove(move, mainBoardState);
    numPosition += posTest(depth - 1);
    mainBoardState.sqrValues = structuredClone(sqrValues);
  });

  return numPosition;
}

export function updateAndGenerateSqrPositions(
  boardSize: number,
  origin: number[]
) {
  boardOrigin = [origin[0] + window.scrollX, origin[1] + window.scrollY];
  store_sqrSize.set(boardSize / 8);
  generateSqrPositions(origin);
}

export function newTurn(
  generateNewMoves: boolean = true,
  boardState: BoardState
) {
  boardState.isTurnToWhite = !boardState.isTurnToWhite;

  if (generateNewMoves) {
    let [gameState, moves] = generateMoves(boardState);
    updateMovesAndGameState(gameState, moves);
    if (boardGameMode !== "pvp") {
      if (boardGameMode === "cvc" || boardState.isTurnToWhite !== isPlayerWhite)
        setTimeout(() => {
          let move = computer.playMove(boardState);
          if (move) makeMove(move);
        }, get(store_cpuMoveSpeed));
    }
  }
}

function updateMovesAndGameState(gameState: gameState, moves: move[]) {
  store_gameState.set(gameState);
  setMoves(moves);
}

export function generateSqrPositions(origin: number[]) {
  let sqrPoses: number[][] = [];
  for (let top = 0; top < 8; top++) {
    for (let left = 0; left < 8; left++) {
      let pos: [number, number] = [
        origin[0] + left * get(store_sqrSize) + window.scrollX,
        origin[1] + top * get(store_sqrSize) + window.scrollY,
      ];
      sqrPoses.push(pos);
    }
  }

  store_sqrPositions.set(sqrPoses);
}

export function loadFEN(fen: string, boardState: BoardState) {
  boardState.sqrValues = new Array(64).fill(NULL);
  let fenPieces = fen.split(" ")[0];

  let isTurnToWhite = fen.split(" ")[1] !== "w";
  boardState.isTurnToWhite = isTurnToWhite;

  let castling = fen.split(" ")[2];
  boardState.castling.blackKing = castling.includes("k");
  boardState.castling.blackQueen = castling.includes("q");
  boardState.castling.whiteKing = castling.includes("K");
  boardState.castling.whiteQueen = castling.includes("Q");

  let x: number = 0;
  let y: number = 0;

  for (let i = 0; i < fenPieces.length; i++) {
    const pieceChar = fenPieces[i];

    if (pieceChar === "/") {
      y++;
      x = 0;
      continue;
    }

    if (Number(pieceChar)) {
      x += Number(pieceChar);
      continue;
    }

    let isWhite = pieceChar.toUpperCase() === pieceChar;
    let piece =
      charToPiece[pieceChar.toLowerCase()] + (isWhite ? WHITE : BLACK);
    boardState.sqrValues[y * 8 + x] = piece;

    x++;
  }
}
