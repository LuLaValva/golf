import { For, createMemo } from "solid-js";
import { CollisionType } from "~/utils/GolfConstants";
import { CollisionObject } from "~/utils/GolfTypes";

export const STROKE_COLORS: { [key in CollisionType]: string } = {
  [CollisionType.NORMAL]: "#444",
  [CollisionType.BOUNCY]: "#b4f",
  [CollisionType.GREEN]: "#6c6",
  [CollisionType.HOLE]: "#080",
  [CollisionType.STICKY]: "#f9d",
  [CollisionType.WATER]: "#0cf",
  [CollisionType.SLIPPERY]: "#aaf",
  [CollisionType.SAND]: "#ca4",
};

type Props = {
  objects: CollisionObject[];
};

export default function CollisionDisplay(props: Props) {
  return (
    <>
      <path d={toPath(props.objects)} fill="#e4dddd" />
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
