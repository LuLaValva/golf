import { For } from "solid-js";
import { CollisionObject, SegmentType } from "~/utils/GolfTypes";

// TODO: Move these into context
const ZOOM = 1;

const STROKE_COLORS: { [key in SegmentType]: string } = {
  [SegmentType.GROUND]: "#a41",
  [SegmentType.BOUNCY]: "#8f8",
  [SegmentType.HOLE]: "#000",
  [SegmentType.STICKY]: "#f4a",
  [SegmentType.WATER]: "#44f",
  [SegmentType.ICE]: "#aaf",
  [SegmentType.SAND]: "#f84",
};

type Props = {
  objects: CollisionObject[];
  padding: number;
};

export default function CollisionDisplay(props: Props) {
  return (
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
              />
            );
          }}
        </For>
      )}
    />
  );
}
