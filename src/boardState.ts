type enPassant = { isPossible: boolean; columnNumber: number };
type caslteState = {
  blackKing: boolean;
  blackQueen: boolean;
  whiteKing: boolean;
  whiteQueen: boolean;
};

export class BoardState {
  constructor() {}

  sqrValues: number[];
  isTurnToWhite: boolean;

  enPassant: enPassant = {
    isPossible: false,
    columnNumber: -1,
  };

  castling: caslteState = {
    blackKing: true,
    blackQueen: true,
    whiteKing: true,
    whiteQueen: true,
  };

  tripleRep: number[][];
  fiftyMove: number;
}

export default {};
