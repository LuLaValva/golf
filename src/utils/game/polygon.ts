import { BALL_RADIUS, SegmentType } from "../GolfConstants";
import { CollisionObject, Point, Vector } from "../GolfTypes";
import { cross, dot, scale, subtract, normalize, add } from "./vector-utils";

type Segment = {
  type: SegmentType;
  start: Point;
  span: Vector;
  unitNormal: Vector;
};

export default class Polygon {
  segments: Segment[];
  points: Point[];

  constructor(object: CollisionObject, startPos: Point) {
    const windingOrder =
      isClockwise(object.points) !== isInPolygon(startPos, object.points);
    this.segments = object.segments.map((segmentType, i) => {
      const span = subtract(
        object.points[(i + 1) % object.points.length],
        object.points[i]
      );
      const unitVector = normalize(span);
      const unitNormal = windingOrder
        ? {
            x: -unitVector.y,
            y: unitVector.x,
          }
        : {
            x: unitVector.y,
            y: -unitVector.x,
          };
      return {
        type: segmentType,
        start: add(object.points[i], scale(unitNormal, BALL_RADIUS)),
        span,
        unitNormal,
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
      if (previousCollision?.with?.includes(segment)) continue;
      const collision = getSegmentIntersection(
        currPos,
        velocity,
        segment,
        previousCollision?.proportion
      );
      nearestCollision = compareCollisions(nearestCollision, collision);
    }
    for (const point of this.points) {
      if (previousCollision?.with?.includes(point)) continue;
      const collision = getPointIntersection(
        currPos,
        velocity,
        point,
        previousCollision?.proportion
      );
      nearestCollision = compareCollisions(nearestCollision, collision);
    }
    return nearestCollision;
  }
}

export interface Collision {
  with: (Segment | Point)[];
  point: Point;
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

  return {
    with: [segment],
    point: add(pos, scale(velocity, proportion * 0.999)),
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

  return {
    with: [point],
    point: add(pos, scale(velocity, proportion * 0.999)),
    proportion: proportion + traveledProportion,
  };
}

function isSegment(obj: Segment | Point): obj is Segment {
  return "unitNormal" in obj;
}

export function velocityFromCollision(collision: Collision, velocity: Vector) {
  // TODO: keep bouncing back and forth until there are no more collisions
  const unitNormals = collision.with.map((obj) =>
    isSegment(obj)
      ? obj.unitNormal
      : scale(subtract(obj, collision.point), 1 / BALL_RADIUS)
  );
  const averageNormal = normalize(
    unitNormals.reduce((normal, unitNormal) => add(normal, unitNormal), {
      x: 0,
      y: 0,
    })
  );
  const normal = scale(averageNormal, dot(velocity, averageNormal));
  const tangent = subtract(velocity, normal);
  // for (const obj of collision.with) {
  //   const unitNormal = isSegment(obj)
  //     ? obj.unitNormal
  //     : scale(subtract(obj, collision.point), 1 / BALL_RADIUS);
  //   const normal = scale(unitNormal, dot(velocity, unitNormal));
  //   const tangent = subtract(velocity, normal);
  //   velocity = add(scale(tangent, 0.96), scale(normal, -0.3));
  // }
  return add(scale(tangent, 0.96), scale(normal, -0.3));
}

/**
 * Compares two collisions and returns the one that happens first.
 * If they happen at the same time, merge them.
 */
export function compareCollisions(a: Collision | null, b: Collision | null) {
  if (!a) return b;
  if (!b) return a;
  if (Math.abs(a.proportion - b.proportion) <= Number.EPSILON) {
    return mergeCollisions(a, b);
  }
  if (a.proportion < b.proportion) return a;
  return b;
}

function mergeCollisions(a: Collision, b: Collision) {
  const newCollision = {
    with: [...a.with, ...b.with],
    point: a.point,
    proportion: a.proportion,
  };
  return newCollision;
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
