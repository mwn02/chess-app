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
} from "./move";

export type sqrValue = { id: number; value: number };
export const INITIAL_POSITION: string =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const INITIAL_POSITION_TEST: string =
  "nrbqbkrn/pppppppp/8/8/8/8/PPPPPPPP/NRBQBKRN w KQkq - 0 1";
const KING_TEST_POS: string = "8/7k/8/Q7/8/8/8/K w - 0 1";

export let store_sqrPositions: Writable<number[][]> = writable([]);
export let store_sqrValues: Writable<sqrValue[]> = writable([]);
export let store_moveOptions: Writable<move[]> = writable([]);
export let store_sqrSize: Writable<number> = writable(0);
export let store_gameState: Writable<gameState> = writable("play");

let charToPiece = {
  k: KING,
  p: PAWN,
  n: KNIGHT,
  b: BISHOP,
  r: ROOK,
  q: QUEEN,
};

export let mainBoardState: BoardState;

export function init(boardSize: number, origin: number[]) {
  updateAndGenerateSqrPositions(boardSize, origin);
  loadBoard();
}

export function loadBoard() {
  mainBoardState = new BoardState();
  mainBoardState.enPassant = {
    isPossible: false,
    columnNumber: -1,
  };
  mainBoardState.tripleRep = [];
  mainBoardState.fiftyMove = 0;

  loadFEN(INITIAL_POSITION);
  previousMove.set(null);
  generateNumSqrsToEdge();
  generateIndexToVector();
  generateMoves(mainBoardState);
  store_sqrValues.set(converNumArrayToSqrValues(mainBoardState.sqrValues));
}

export function updateAndGenerateSqrPositions(
  boardSize: number,
  origin: number[]
) {
  store_sqrSize.set(boardSize / 8);
  generateSqrPositions(origin);
}

export function newTurn(
  generateNewMoves: boolean = true,
  boardState: BoardState
) {
  boardState.isTurnToWhite = !boardState.isTurnToWhite;
  if (generateNewMoves) store_gameState.set(generateMoves(boardState));
}

export function generateSqrPositions(origin: number[]) {
  let sqrPoses: number[][] = [];
  for (let top = 0; top < 8; top++) {
    for (let left = 0; left < 8; left++) {
      let pos: [number, number] = [
        origin[0] + left * get(store_sqrSize),
        origin[1] + top * get(store_sqrSize),
      ];
      sqrPoses.push(pos);
    }
  }

  store_sqrPositions.set(sqrPoses);
}

export function loadFEN(fen: string) {
  mainBoardState.sqrValues = new Array().fill(NULL);
  let fenPieces = fen.split(" ")[0];

  let isTurnToWhite = fen.split(" ")[1] === "w";
  mainBoardState.isTurnToWhite = isTurnToWhite;

  let castling = fen.split(" ")[2];
  mainBoardState.castling.blackKing = castling.includes("k");
  mainBoardState.castling.blackQueen = castling.includes("q");
  mainBoardState.castling.whiteKing = castling.includes("K");
  mainBoardState.castling.whiteQueen = castling.includes("Q");

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
    mainBoardState.sqrValues[y * 8 + x] = piece;

    x++;
  }
}
