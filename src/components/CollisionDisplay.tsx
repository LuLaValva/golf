import { For } from "solid-js";
import { PADDING } from "~/routes/editor";
import { CollisionType } from "~/utils/GolfConstants";
import { CollisionObject } from "~/utils/GolfTypes";

// TODO: Move these into context
const ZOOM = 1;

export const STROKE_COLORS: { [key in CollisionType]: string } = {
  [CollisionType.NORMAL]: "#a41",
  [CollisionType.BOUNCY]: "#8f8",
  [CollisionType.GREEN]: "#4a4",
  [CollisionType.STICKY]: "#f4a",
  [CollisionType.WATER]: "#44f",
  [CollisionType.SLIPPERY]: "#aaf",
  [CollisionType.SAND]: "#f84",
};

type Props = {
  objects: CollisionObject[];
  padding: number;
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
                  x1={(props.padding + point1().x) * ZOOM}
                  y1={(props.padding + point1().y) * ZOOM}
                  x2={(props.padding + point2().x) * ZOOM}
                  y2={(props.padding + point2().y) * ZOOM}
                  stroke={STROKE_COLORS[segmentType]}
                  stroke-width={3}
                  stroke-linecap="round"
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
      .map(({ points }) =>
        points.map(({ x, y }) => `${x + PADDING} ${y + PADDING}`).join("L")
      )
      .join("M")
  );
}
