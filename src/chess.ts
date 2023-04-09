import { get } from "svelte/store";
import { store_sqrSize, type sqrValue } from "./board";

export const NULL = 0;
export const KING = 1;
export const PAWN: number = 2;
export const KNIGHT: number = 3;
export const BISHOP: number = 4;
export const ROOK: number = 5;
export const QUEEN: number = 6;
export const BLACK: number = 8;
export const WHITE: number = 16;

export function extractFromValue(
  value: number
): [pieceType: number, color: number, isWhite: boolean] {
  let color: number = getColor(value);
  let pieceType = value - color;

  return [pieceType, color, color === WHITE];
}

export function getColor(value: number): number {
  return !value ? NULL : value > WHITE ? WHITE : BLACK;
}

export function boolToColor(isTurnToWhite: boolean): number {
  return isTurnToWhite ? WHITE : BLACK;
}

export function isSqrOutOfBound(sqr: number): boolean {
  return sqr < 0 || sqr > 63;
}

export function getHoveredSqrIndex(x: number, y: number): number {
  let indexY = Math.floor(y / get(store_sqrSize));
  let indexX = Math.floor(x / get(store_sqrSize));
  let index = indexY * 8 + indexX;
  return indexY > 7 || indexY < 0 || indexX > 7 || indexX < 0 ? -1 : index;
}

export function converNumArrayToSqrValues(numArray: number[]): sqrValue[] {
  let sqrValues: sqrValue[] = [];
  for (let i = 0; i < 64; i++) {
    sqrValues.push({
      id: i,
      value: numArray[i],
    });
  }

  return sqrValues;
}
