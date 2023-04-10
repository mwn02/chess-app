import type { BoardState } from "./boardState";
import { generateMoves, type move } from "./move";

function evaluatePosition(boardState: BoardState): move {
  let moves = generateMoves(boardState)[1];
  return moves[getRandomNumber(0, moves.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

export default { evaluatePosition };
