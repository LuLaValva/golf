import { For, createMemo } from "solid-js";
import { CollisionType } from "~/utils/GolfConstants";
import { CollisionObject } from "~/utils/GolfTypes";

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

type Props = {
  objects: CollisionObject[];
};

export default function CollisionDisplay(props: Props) {
  return (
    <>
      <path d={toPath(props.objects)} fill="var(--polygon-fill)" />
      <For
        each={props.objects}
        children={(polygon) => {
          const sortedSegments = createMemo(() =>
            polygon.segments
              .map((type, i) => ({
                type,
                points: [
                  polygon.points[i],
                  polygon.points[(i + 1) % polygon.points.length],
                ],
              }))
              .sort((a, b) => b.type - a.type)
          );
          return (
            <For each={sortedSegments()}>
              {({ type, points: [point1, point2] }) => (
                <line
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke={STROKE_COLORS[type]}
                  stroke-width="5"
                  stroke-linecap="round"
                  // vector-effect="non-scaling-stroke"
                />
              )}
            </For>
          );
        }}
      />
    </>
  );
}

function toPath(objects: CollisionObject[]) {
  return (
    "M" +
    objects
      .map(({ points }) => points.map(({ x, y }) => `${x} ${y}`).join("L"))
      .join("M")
  );
}
