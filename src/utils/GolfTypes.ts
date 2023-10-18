import { CollisionType } from "./GolfConstants";

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export type CollisionObject = {
  points: Point[];
  segments: CollisionType[];
  motion?: {
    loop?: boolean;
    states: {
      rotation: number;
      offset: Point;
    };
  };
};

export interface HoleData {
  collisionObjects: CollisionObject[];
  startPos: Point;
  dimensions: Point;
}

export interface Launch {
  position: Point;
  velocity: Vector;
  outOfBounds?: boolean;
}

export interface FlagPosition {
  root: Point;
  direction: Vector;
}
