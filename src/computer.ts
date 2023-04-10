import type { BoardState } from "./boardState";
import evaluation from "./evaluation";
import type { move } from "./move";

function playMove(boardState: BoardState): move {
  return evaluation.evaluatePosition(boardState);
}

export default { playMove };
