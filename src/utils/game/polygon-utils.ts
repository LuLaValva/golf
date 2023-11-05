import { Point } from "../GolfTypes";
import { cross, subtract } from "./vector-utils";

export function isClockwise(points: Point[]) {
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

export function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      polygon[i].y > point.y !== polygon[j].y > point.y &&
      point.x <
        ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
          (polygon[j].y - polygon[i].y) +
          polygon[i].x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
