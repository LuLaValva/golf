export enum SegmentType {
  GROUND,
  WATER,
  STICKY,
  BOUNCY,
  HOLE,
  ICE,
  SAND,
}

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
  segments: SegmentType[];
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
