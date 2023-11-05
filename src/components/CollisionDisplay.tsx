import { For, JSX, createMemo, createUniqueId } from "solid-js";
import { BALL_RADIUS, CollisionType } from "~/utils/GolfConstants";
import { CollisionObject, Point } from "~/utils/GolfTypes";
import { isClockwise, pointInPolygon } from "~/utils/game/polygon-utils";
import { add, scale, normalize, subtract } from "~/utils/game/vector-utils";

export const STROKE_COLORS: { [key in CollisionType]: string } = {
  [CollisionType.NORMAL]: "var(--surface-type-normal)",
  [CollisionType.BOUNCY]: "var(--surface-type-bouncy)",
  [CollisionType.GREEN]: "var(--surface-type-green)",
  [CollisionType.HOLE]: "var(--surface-type-hole)",
  [CollisionType.STICKY]: "var(--surface-type-sticky)",
  [CollisionType.WATER]: "var(--surface-type-water)",
  [CollisionType.SLIPPERY]: "var(--surface-type-slippery)",
  [CollisionType.SAND]: "var(--surface-type-sand)",
};

const STICKY_DISPLACEMENT = 4;

type Props = {
  startPos: Point;
  stageDimensions: Point;
  objects: CollisionObject[];
};

export default function CollisionDisplay(props: Props) {
  const uniqueId = createUniqueId();
  const layers = createMemo(() => {
    const layers = {
      clipPaths: [] as JSX.Element[],
      backgroundElements: [] as JSX.Element[],
      strokeSets: [] as JSX.Element[][],
      foregroundElements: [] as JSX.Element[],
    };
    for (const i in props.objects) {
      const polygon = props.objects[i];
      const windingOrder = isClockwise(polygon.points);
      const containsPoint = pointInPolygon(props.startPos, polygon.points);
      const path = toPath(
        polygon.points,
        containsPoint
          ? {
              windingOrder,
              stageDimensions: props.stageDimensions,
            }
          : undefined
      );
      const clipId = `polygon-${uniqueId}-${i}`;
      if (polygon.segments.length === polygon.points.length) {
        layers.clipPaths.push(
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        );
      }
      for (const i in polygon.segments) {
        const type = polygon.segments[i];
        const point1 = polygon.points[i];
        const point2 = polygon.points[(+i + 1) % polygon.points.length];
        (layers.strokeSets[type] ??= []).push(
          <line x1={point1.x} y1={point1.y} x2={point2.x} y2={point2.y} />
        );
        if (type === CollisionType.HOLE) {
          layers.foregroundElements.push(
            flag([point1, point2], windingOrder === containsPoint)
          );
        } else if (type === CollisionType.WATER) {
          layers.backgroundElements.push(
            water([point1, point2], windingOrder === containsPoint, clipId)
          );
        } else if (type === CollisionType.STICKY) {
          layers.backgroundElements.push(sticky([point1, point2], clipId));
        } else if (type === CollisionType.BOUNCY) {
          layers.backgroundElements.push(
            bouncy([point1, point2], windingOrder === containsPoint, clipId)
          );
        }
      }
    }
    return layers;
  });

  return (
    <>
      <defs>
        <filter id="sticky-displacement" filterUnits="userSpaceOnUse">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.03"
            numOctaves="2"
            result="turbulence"
          />
          <feDisplacementMap
            in2="turbulence"
            in="SourceGraphic"
            scale={STICKY_DISPLACEMENT ** 2}
            xChannelSelector="B"
            yChannelSelector="A"
          />
        </filter>
        {layers().clipPaths}
      </defs>
      <g fill="var(--polygon-fill)">
        <For each={layers().clipPaths}>
          {(_, i) => (
            <rect
              width={props.stageDimensions.x}
              height={props.stageDimensions.y}
              clip-path={`url(#polygon-${uniqueId}-${i()})`}
            />
          )}
        </For>
      </g>
      {layers().backgroundElements}
      <g stroke-width="5" stroke-linecap="round">
        <For each={Object.entries(layers().strokeSets).reverse()}>
          {([i, strokeSet]) => (
            <g stroke={STROKE_COLORS[i as unknown as CollisionType]}>
              {strokeSet}
            </g>
          )}
        </For>
      </g>
      {layers().foregroundElements}
    </>
  );
}

function toPath(
  points: Point[],
  invert?: {
    windingOrder: boolean;
    stageDimensions: Point;
  }
) {
  const path = "M" + points.map(({ x, y }) => `${x} ${y}`).join("L") + "Z";
  if (invert) {
    if (invert.windingOrder) {
      return `M0 0h${invert.stageDimensions.x}v${invert.stageDimensions.y}h-${invert.stageDimensions.x}Z ${path}`;
    } else {
      return `M0 0v${invert.stageDimensions.y}h${invert.stageDimensions.x}v-${invert.stageDimensions.y}Z ${path}`;
    }
  }
  return path;
}

function flag(segment: [Point, Point], direction: boolean) {
  const middle = scale(add(segment[0], segment[1]), 0.5);
  const rotation =
    (Math.atan2(segment[1].y - segment[0].y, segment[1].x - segment[0].x) *
      180) /
    Math.PI;
  const transform = `translate(${middle.x} ${middle.y}) rotate(${
    rotation + (direction ? -90 : 90)
  } 0 0)`;

  return (
    <>
      <ellipse rx="2" ry={BALL_RADIUS * 2} transform={transform} />
      <line
        x1="-1"
        x2="34"
        stroke-linecap="round"
        stroke-width="2"
        stroke="var(--flag-pole)"
        transform={transform}
      />
      <polygon
        points="34,0 28,-16 22,0"
        fill="red"
        stroke="var(--accent-stroke)"
        transform={transform}
      />
    </>
  );
}

function water(segment: [Point, Point], direction: boolean, clipId: string) {
  const size =
    Math.hypot(segment[1].x - segment[0].x, segment[1].y - segment[0].y) * 0.6;

  return (
    <path
      d={`M${segment[0].x} ${segment[0].y}A${size} ${size} 0 0 ${
        direction ? 0 : 1
      } ${segment[1].x} ${segment[1].y}`}
      stroke="none"
      fill="var(--surface-type-water)"
      clip-path={`url(#${clipId})`}
    />
  );
}

function sticky(segment: [Point, Point], clipId: string) {
  return (
    <line
      x1={segment[0].x - STICKY_DISPLACEMENT}
      y1={segment[0].y - STICKY_DISPLACEMENT}
      x2={segment[1].x - STICKY_DISPLACEMENT}
      y2={segment[1].y - STICKY_DISPLACEMENT}
      stroke-width={12}
      stroke-linecap="round"
      stroke="var(--surface-type-sticky)"
      filter="url(#sticky-displacement)"
      clip-path={`url(#${clipId})`}
    />
  );
}

function bouncy(segment: [Point, Point], direction: boolean, clipId: string) {
  const normalized = normalize(subtract(segment[1], segment[0]));
  const ortho = direction
    ? {
        x: -normalized.y,
        y: normalized.x,
      }
    : {
        x: normalized.y,
        y: -normalized.x,
      };
  return (
    <>
      <line
        x1={segment[0].x + ortho.x * 5}
        y1={segment[0].y + ortho.y * 5}
        x2={segment[1].x + ortho.x * 5}
        y2={segment[1].y + ortho.y * 5}
        stroke-width={2}
        stroke-linecap="round"
        stroke="var(--surface-type-bouncy)"
        clip-path={`url(#${clipId})`}
      />
      <line
        x1={segment[0].x + ortho.x * 8}
        y1={segment[0].y + ortho.y * 8}
        x2={segment[1].x + ortho.x * 8}
        y2={segment[1].y + ortho.y * 8}
        stroke-width={1}
        stroke-linecap="round"
        stroke="var(--surface-type-bouncy)"
        clip-path={`url(#${clipId})`}
      />
    </>
  );
}
