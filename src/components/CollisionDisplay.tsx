import { For } from "solid-js";
import { CollisionType } from "~/utils/GolfConstants";
import { CollisionObject } from "~/utils/GolfTypes";

export const STROKE_COLORS: { [key in CollisionType]: string } = {
  [CollisionType.NORMAL]: "#a41",
  [CollisionType.BOUNCY]: "#8f8",
  [CollisionType.GREEN]: "#4a4",
  [CollisionType.HOLE]: "#080",
  [CollisionType.STICKY]: "#f4a",
  [CollisionType.WATER]: "#44f",
  [CollisionType.SLIPPERY]: "#aaf",
  [CollisionType.SAND]: "#f84",
};

type Props = {
  objects: CollisionObject[];
};

export default function CollisionDisplay(props: Props) {
  return (
    <>
      <path d={toPath(props.objects)} fill="#fdd" />
      <For
        each={props.objects}
        children={(polygon) => (
          <For each={polygon.segments}>
            {(segmentType, i) => {
              const point1 = () => polygon.points[i()];
              const point2 = () =>
                polygon.points[(i() + 1) % polygon.points.length];
              return (
                <line
                  x1={point1().x}
                  y1={point1().y}
                  x2={point2().x}
                  y2={point2().y}
                  stroke={STROKE_COLORS[segmentType]}
                  stroke-width={3}
                  stroke-linecap="round"
                  vector-effect="non-scaling-stroke"
                />
              );
            }}
          </For>
        )}
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
