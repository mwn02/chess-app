import { writable, type Writable } from "svelte/store";
import { mainBoardState, newTurn, store_sqrValues } from "./board";
import type { BoardState } from "./boardState";
import {
  BISHOP,
  boolToColor,
  converNumArrayToSqrValues,
  extractFromValue,
  getColor,
  isSqrOutOfBound,
  KING,
  KNIGHT,
  NULL,
  PAWN,
  QUEEN,
  ROOK,
} from "./chess";

export type move = {
  startSqr: number;
  targetSqr: number;
  hasDoublePawnMove?: boolean;
  enPassantTargetSqr?: number;
  promotion?: number;
  castle?: {
    increment: number;
    rookIndex: number;
  };
};
export let moves: move[] = [];
export function setMoves(_moves: move[]) {
  moves = structuredClone(_moves);
}

export type gameState = {
  state: "play" | "end";
  reason: "checkmate" | "stalemate" | "tripleRep" | "50move" | "draw" | "none";
};

const DIRECTIONS: number[] = [8, -8, 1, -1, 7, -7, 9, -9];
const KNIGHT_DIRS: number[] = [
  16 - 1, // up left
  16 + 1, // up right
  2 + 8, // right up
  2 - 8, // right down
  -16 + 1, // down right
  -16 - 1, // down left
  -2 - 8, // left down
  -2 + 8, // left up
];
const PROMOTION_TYPES: number[] = [QUEEN, KNIGHT, ROOK, BISHOP];
const CASTLE_POSITIONS: number[] = [2, 6, 58, 62];
let numSqrToEdge: number[][] = [];
export let indexToVector: number[][] = [];
export let previousMove: Writable<move> = writable(null);

export function makeMove(
  move: move,
  boardState?: BoardState,
  updateVisual: boolean = true
) {
  if (boardState === undefined) boardState = mainBoardState;

  const pieceType =
    boardState.sqrValues[move.startSqr] - boolToColor(boardState.isTurnToWhite);

  updateFiftyMoveRule();
  updateEnPassantState();
  makeMainMove();
  updateCastlingRook();
  updateCastlingState();

  if (updateVisual) {
    store_sqrValues.set(converNumArrayToSqrValues(boardState.sqrValues));
    previousMove.set(move);
  }
  updateTripleRepRule();

  newTurn(updateVisual, boardState);

  function updateFiftyMoveRule() {
    boardState.fiftyMove++;

    if (pieceType === PAWN || boardState.sqrValues[move.targetSqr])
      boardState.fiftyMove = 0;
  }

  function updateTripleRepRule() {
    if (pieceType === PAWN) boardState.tripleRep = [];
    else boardState.tripleRep.push(structuredClone(boardState.sqrValues));
  }

  function updateEnPassantState() {
    boardState.enPassant.isPossible = false;
    if (move.hasDoublePawnMove) {
      boardState.enPassant = {
        isPossible: true,
        columnNumber: indexToVector[move.targetSqr][0],
      };
    }
  }

  function makeMainMove() {
    boardState.sqrValues[move.targetSqr] = move.promotion
      ? move.promotion
      : boardState.sqrValues[move.startSqr];
    boardState.sqrValues[move.startSqr] = NULL;

    if (move.enPassantTargetSqr !== undefined)
      boardState.sqrValues[move.enPassantTargetSqr] = NULL;
  }

  function updateCastlingRook() {
    if (move.castle) {
      boardState.sqrValues[move.targetSqr - move.castle.increment] =
        ROOK + boolToColor(boardState.isTurnToWhite);

      if (
        boardState.sqrValues[move.castle.rookIndex] ===
        ROOK + boolToColor(boardState.isTurnToWhite)
      )
        boardState.sqrValues[move.castle.rookIndex] = NULL;
    }
  }

  function updateCastlingState() {
    if (move.castle || pieceType === KING) {
      if (boardState.isTurnToWhite) {
        boardState.castling.whiteKing = false;
        boardState.castling.whiteQueen = false;
      } else {
        boardState.castling.blackKing = false;
        boardState.castling.blackQueen = false;
      }
    } else if (pieceType === ROOK) {
      const kingIndex = boardState.sqrValues.findIndex(
        (n) => n === KING + boolToColor(boardState.isTurnToWhite)
      );
      if (move.startSqr < kingIndex) {
        if (boardState.isTurnToWhite) boardState.castling.whiteQueen = false;
        else boardState.castling.blackQueen = false;
      } else {
        if (boardState.isTurnToWhite) boardState.castling.whiteKing = false;
        else boardState.castling.blackKing = false;
      }
    }
  }
}

export function generateNumSqrsToEdge() {
  numSqrToEdge = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let numNorth = 7 - y;
      let numSouth = y;
      let numEast = 7 - x;
      let numWest = x;

      numSqrToEdge.push([
        numNorth,
        numSouth,
        numEast,
        numWest,
        Math.min(numNorth, numWest),
        Math.min(numSouth, numEast),
        Math.min(numNorth, numEast),
        Math.min(numSouth, numWest),
      ]);
    }
  }
}

export function generateIndexToVector() {
  indexToVector = [];
  for (let i = 0; i < 64; i++) {
    let x = i % 8;
    let y = Math.floor(i / 8);

    indexToVector.push([x, y]);
  }
}

export function generateMoves(boardState: BoardState): [gameState, move[]] {
  if (boardState.fiftyMove > 99)
    return [{ state: "end", reason: "50move" }, []];
  if (hasTripleRepition()) return [{ state: "end", reason: "tripleRep" }, []];

  let pseudoMoves = generatePseudoMoves(boardState);
  const kingIndex = boardState.sqrValues.findIndex(
    (n) => n === KING + boolToColor(boardState.isTurnToWhite)
  );

  for (let i = 0; i < pseudoMoves.length; i++) {
    const move = pseudoMoves[i];
    let newKingIndex = kingIndex;
    let boardStateCopy = structuredClone(boardState);

    makeMove(move, boardStateCopy, false);
    if (
      boardStateCopy.sqrValues[move.targetSqr] ===
      KING + boolToColor(boardState.isTurnToWhite)
    )
      newKingIndex = move.targetSqr;

    if (move.castle) {
      let numSqrsFromTarget = Math.abs(move.targetSqr - move.startSqr);
      for (let i = 0; i <= numSqrsFromTarget; i++) {
        const newKingIndex = move.startSqr + move.castle.increment * i;
        checkIfInCheck(newKingIndex);
      }
    } else checkIfInCheck(newKingIndex);

    function checkIfInCheck(newKingIndex: number) {
      let opponentPseudoMoves = generatePseudoMoves(boardStateCopy);
      if (isKingAttacked(newKingIndex, opponentPseudoMoves)) {
        pseudoMoves.splice(i, 1);
        i--;
      }
    }
  }

  if (pseudoMoves.length > 0)
    return [{ state: "play", reason: "none" }, pseudoMoves];

  let otherBoardState: BoardState = structuredClone(boardState);
  otherBoardState.isTurnToWhite = !otherBoardState.isTurnToWhite;
  if (isKingAttacked(kingIndex, generatePseudoMoves(otherBoardState)))
    return [{ state: "end", reason: "checkmate" }, []];
  return [{ state: "end", reason: "stalemate" }, []];

  function isKingAttacked(
    kingIndex: number,
    opponentPseudoMoves: move[]
  ): boolean {
    return opponentPseudoMoves.some((m) => m.targetSqr === kingIndex);
  }

  function hasTripleRepition(): boolean {
    let count = 0;
    const sqrValues = boardState.tripleRep[boardState.tripleRep.length - 1];

    for (let i = boardState.tripleRep.length - 3; i >= 0; i -= 2) {
      const otherSqrValues = boardState.tripleRep[i];
      if (sqrValues.every((val, index) => val === otherSqrValues[index]))
        count++;

      if (count > 1) return true;
    }

    return false;
  }
}

function generatePseudoMoves(_boardState: BoardState): move[] {
  let moves: move[] = [];
  const boardState = _boardState;

  for (let startSqr = 0; startSqr < boardState.sqrValues.length; startSqr++) {
    const value = boardState.sqrValues[startSqr];

    const [pieceType, color, isWhite] = extractFromValue(value);

    if (!pieceType || isWhite !== boardState.isTurnToWhite) continue;

    if (pieceType === BISHOP || pieceType === QUEEN || pieceType === ROOK) {
      slidingPiece();
    } else if (pieceType === KNIGHT) knigth();
    else if (pieceType === PAWN) pawn();
    else if (pieceType === KING) king();

    function king() {
      let [x, y] = indexToVector[startSqr];
      for (let i = 0; i < DIRECTIONS.length; i++) {
        const targetSqr = startSqr + DIRECTIONS[i];
        if (isSqrOutOfBound(targetSqr)) continue;
        let [tx, ty] = indexToVector[targetSqr];

        if (Math.abs(x - tx) > 1 || Math.abs(y - ty) > 1) continue; // Is checking y necessary?

        const targetPiece = boardState.sqrValues[targetSqr];

        if (getColor(targetPiece) === color) continue;
        moves.push({ startSqr, targetSqr });
      }

      const canKingCastle = isWhite
        ? boardState.castling.whiteKing
        : boardState.castling.blackKing;
      const canQueenCastle = isWhite
        ? boardState.castling.whiteQueen
        : boardState.castling.blackQueen;

      if (canKingCastle) {
        let rookIndex = boardState.sqrValues.findIndex(
          (sqr, index) => sqr - color === ROOK && index > startSqr
        );

        if (rookIndex > -1 && hasNoPiecesAround(1, rookIndex - startSqr)) {
          const castlePosIndex = (color / 8 - 1) * 2 + 1;
          moves.push({
            startSqr,
            targetSqr: CASTLE_POSITIONS[castlePosIndex],
            castle: {
              increment: 1,
              rookIndex,
            },
          });
        }
      }
      if (canQueenCastle) {
        let rookIndex = boardState.sqrValues.findIndex(
          (sqr, index) => sqr - color === ROOK && index < startSqr
        );

        if (rookIndex > -1 && hasNoPiecesAround(-1, startSqr - rookIndex)) {
          const castlePosIndex = (color / 8 - 1) * 2;
          moves.push({
            startSqr,
            targetSqr: CASTLE_POSITIONS[castlePosIndex],
            castle: {
              increment: -1,
              rookIndex,
            },
          });
        }
      }
      function hasNoPiecesAround(
        increment: 1 | -1,
        numSqrFromRook: number
      ): boolean {
        for (let i = 1; i < numSqrFromRook; i++) {
          const targetSqr = startSqr + i * increment;

          if (boardState.sqrValues[targetSqr]) return false;
        }

        return true;
      }
    }

    function pawn() {
      const dir = boardState.isTurnToWhite ? -8 : 8;

      const upwardSqr = startSqr + dir;
      let targetPiece = boardState.sqrValues[upwardSqr];
      if (!targetPiece) {
        if (isOnNthRank(6)) addPromotionMoves(upwardSqr);
        else {
          moves.push({ startSqr, targetSqr: upwardSqr });

          if (isOnNthRank(1)) {
            const doubleUpwardSqr = startSqr + dir * 2;

            targetPiece = boardState.sqrValues[doubleUpwardSqr];
            if (!targetPiece)
              moves.push({
                startSqr,
                targetSqr: doubleUpwardSqr,
                hasDoublePawnMove: true,
              });
          }
        }
      }

      const eatSqrs = [startSqr + dir + 1, startSqr + dir - 1];
      for (let i = 0; i < eatSqrs.length; i++) {
        const targetSqr = eatSqrs[i];
        const targetPiece = boardState.sqrValues[targetSqr];

        if (isSqrOutOfBound(targetSqr)) continue;

        const [sqrX, sqrY] = indexToVector[startSqr];
        const [targetSqrX, targetSqrY] = indexToVector[targetSqr];
        const isX = Math.abs(targetSqrX - sqrX) < 2;
        const isY = Math.abs(targetSqrY - sqrY) < 2;

        if (!(isX && isY)) continue;

        if (targetPiece) {
          if (getColor(targetPiece) !== color)
            if (isOnNthRank(6)) addPromotionMoves(targetSqr);
            else moves.push({ startSqr, targetSqr });
        } else {
          if (boardState.enPassant.isPossible && isOnNthRank(4)) {
            let enPassantTargetSqr = targetSqr - dir;

            if (
              boardState.enPassant.columnNumber ===
              indexToVector[enPassantTargetSqr][0]
            )
              moves.push({ startSqr, targetSqr, enPassantTargetSqr });
          }
        }
      }

      function addPromotionMoves(targetSqr: number) {
        for (let i = 0; i < PROMOTION_TYPES.length; i++) {
          moves.push({
            startSqr,
            targetSqr,
            promotion: PROMOTION_TYPES[i] + color,
          });
        }
      }

      function isOnNthRank(rankForBlack: number): boolean {
        const rowNum = indexToVector[startSqr][1];
        return boardState.isTurnToWhite
          ? rowNum === 7 - rankForBlack
          : rowNum === rankForBlack;
      }
    }

    function knigth() {
      const [sqrX, sqrY] = indexToVector[startSqr];

      for (let i = 0; i < KNIGHT_DIRS.length; i++) {
        const targetSqr = startSqr + KNIGHT_DIRS[i];
        if (isSqrOutOfBound(targetSqr)) continue;

        const targetPiece = boardState.sqrValues[targetSqr];

        if (getColor(targetPiece) === color) continue;

        const [targetSqrX, targetSqrY] = indexToVector[targetSqr];
        const isX = Math.abs(targetSqrX - sqrX) < 3;
        const isY = Math.abs(targetSqrY - sqrY) < 3;

        if (isX && isY) moves.push({ startSqr, targetSqr });
      }
    }

    function slidingPiece() {
      const startIndex: number = pieceType === BISHOP ? 4 : 0;
      const endIndex: number = pieceType === ROOK ? 4 : 8;

      for (let dirIndex = startIndex; dirIndex < endIndex; dirIndex++) {
        for (let n = 0; n < numSqrToEdge[startSqr][dirIndex]; n++) {
          const targetSqr = startSqr + DIRECTIONS[dirIndex] * (n + 1);
          const targetPiece = boardState.sqrValues[targetSqr];

          if (getColor(targetPiece) === color) break;

          moves.push({ startSqr, targetSqr });

          if (targetPiece) break;
        }
      }
    }
  }

  return moves;
}
