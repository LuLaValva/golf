import { CollisionObject, Point, SegmentType, Vector } from "../GolfTypes";
import { cross, dot, scale, subtract, normalize } from "./vector-utils";

type Segment = {
  type: SegmentType;
  start: Point;
  span: Vector;
  unitVector: Vector;
};

export default class Polygon {
  segments: Segment[];

  constructor(object: CollisionObject) {
    this.segments = object.segments.map((segmentType, i) => {
      const span = subtract(
        object.points[(i + 1) % object.points.length],
        object.points[i]
      );
      return {
        type: segmentType,
        start: object.points[i],
        span,
        unitVector: normalize(span),
      };
    });
  }

  findNearestCollision(
    currPos: Point,
    velocity: Vector,
    previousCollision?: Collision
  ) {
    let nearestCollision: Collision | null = null;
    for (const segment of this.segments) {
      if (segment === previousCollision?.segment) continue;
      const collision = getSegmentIntersection(
        currPos,
        velocity,
        segment,
        previousCollision?.proportion
      );
      if (
        collision &&
        (!nearestCollision ||
          collision.proportion < nearestCollision.proportion)
      ) {
        nearestCollision = collision;
      }
    }
    return nearestCollision;
  }
}

export interface Collision {
  segment: Segment;
  point: Point;
  /** projection in the normal direction */
  normal: Vector;
  /** projection in the tangent direction */
  tangent: Vector;
  proportion: number;
}

function getSegmentIntersection(
  pos: Point,
  velocity: Vector,
  segment: Segment,
  traveledProportion = 0
): Collision | null {
  // https://stackoverflow.com/a/565282
  const denominator = cross(velocity, segment.span);
  if (denominator === 0) return null;
  const distance = subtract(segment.start, pos);
  const proportion = cross(distance, segment.span) / denominator;
  if (proportion < 0 || proportion > 1 - traveledProportion) return null;
  const u = cross(distance, velocity) / denominator;
  if (u < 0 || u > 1) return null;

  const tangent = scale(segment.unitVector, dot(velocity, segment.unitVector));
  const normal = subtract(velocity, tangent);

  return {
    segment,
    point: {
      x: pos.x + proportion * velocity.x,
      y: pos.y + proportion * velocity.y,
    },
    normal,
    tangent,
    proportion: proportion + traveledProportion,
  };
}
