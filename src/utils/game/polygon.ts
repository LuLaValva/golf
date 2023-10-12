import { BALL_RADIUS, SegmentType } from "../GolfConstants";
import { CollisionObject, Point, Vector } from "../GolfTypes";
import { cross, dot, scale, subtract, normalize, add } from "./vector-utils";

type Segment = {
  type: SegmentType;
  start: Point;
  span: Vector;
  unitVector: Vector;
};

export default class Polygon {
  segments: Segment[];
  points: Point[];

  constructor(object: CollisionObject, startPos: Point) {
    const segmentOffset =
      isClockwise(object.points) !== isInPolygon(startPos, object.points)
        ? BALL_RADIUS
        : -BALL_RADIUS;
    this.segments = object.segments.map((segmentType, i) => {
      const span = subtract(
        object.points[(i + 1) % object.points.length],
        object.points[i]
      );
      const unitVector = normalize(span);
      const unitNormal = {
        x: -unitVector.y,
        y: unitVector.x,
      };
      return {
        type: segmentType,
        start: add(object.points[i], scale(unitNormal, segmentOffset)),
        span,
        unitVector,
      };
    });
    this.points = object.points;
  }

  findNearestCollision(
    currPos: Point,
    velocity: Vector,
    previousCollision?: Collision
  ) {
    let nearestCollision: Collision | null = null;
    for (const segment of this.segments) {
      if (segment === previousCollision?.with) continue;
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
    for (const point of this.points) {
      if (point === previousCollision?.with) continue;
      const collision = getPointIntersection(
        currPos,
        velocity,
        point,
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
  with: Segment | Point;
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

  const intersection = add(pos, scale(velocity, proportion));

  const tangent = scale(segment.unitVector, dot(velocity, segment.unitVector));
  const normal = subtract(velocity, tangent);

  return {
    with: segment,
    point: intersection,
    normal,
    tangent,
    proportion: proportion + traveledProportion,
  };
}

function getPointIntersection(
  pos: Point,
  velocity: Vector,
  point: Point,
  traveledProportion = 0
): Collision | null {
  const distance = subtract(pos, point);

  const a = velocity.x ** 2 + velocity.y ** 2;
  const b = 2 * dot(velocity, distance);
  const c = dot(distance, distance) - BALL_RADIUS ** 2;

  const discriminant = b ** 2 - 4 * a * c;

  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);

  let proportion = (-b - root) / (2 * a);
  if (proportion < 0 || proportion > 1 - traveledProportion) {
    proportion = (-b + root) / (2 * a);
    if (proportion < 0 || proportion > 1 - traveledProportion) return null;
  }

  const intersection = add(pos, scale(velocity, proportion * 0.9999));

  const unitNormal = scale(subtract(point, intersection), 1 / BALL_RADIUS);

  const normal = scale(unitNormal, dot(velocity, unitNormal));
  const tangent = subtract(velocity, normal);

  return {
    with: point,
    point: intersection,
    normal,
    tangent,
    proportion: proportion + traveledProportion,
  };
}

function isClockwise(points: Point[]) {
  let bottomRight = 0;
  for (let i = 1; i < points.length; i++) {
    if (
      points[i].y < points[bottomRight].y ||
      (points[i].y == points[bottomRight].y &&
        points[i].x > points[bottomRight].x)
    ) {
      bottomRight = i;
    }
  }
  return (
    cross(
      subtract(
        points[(bottomRight - 1 + points.length) % points.length],
        points[bottomRight]
      ),
      subtract(points[(bottomRight + 1) % points.length], points[bottomRight])
    ) > 0
  );
}

function isInPolygon(position: Point, points: Point[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    if (
      points[i].y > position.y !== points[j].y > position.y &&
      position.x <
        ((points[j].x - points[i].x) * (position.y - points[i].y)) /
          (points[j].y - points[i].y) +
          points[i].x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
