import { Vector } from "../GolfTypes";

export function dot(a: Vector, b: Vector) {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vector, b: Vector) {
  return a.x * b.y - a.y * b.x;
}

export function subtract(a: Vector, b: Vector): Vector {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function normalize(vector: Vector) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return { x: vector.x / length, y: vector.y / length };
}

export function scale(vector: Vector, scalar: number) {
  return { x: vector.x * scalar, y: vector.y * scalar };
}
