import { For, createSignal, useContext } from "solid-js";
import { DataContext, PADDING } from "../editor";
import styles from "../editor.module.css";
import { CollisionType } from "~/utils/GolfConstants";
import { add, scale } from "~/utils/game/vector-utils";
import { STROKE_COLORS } from "~/components/CollisionDisplay";

const TYPE_TIITLES: {
  [key in CollisionType]: string;
} = {
  [CollisionType.NORMAL]: "Default",
  [CollisionType.BOUNCY]: "Bouncy",
  [CollisionType.SLIPPERY]: "Slippery",
  [CollisionType.STICKY]: "Sticky",
  [CollisionType.SAND]: "Sand",
  [CollisionType.WATER]: "Water Hazard",
  [CollisionType.GREEN]: "Green & Hole",
};

export default function PaintMode() {
  const [data, updateData] = useContext(DataContext)!;
  const [alignTo, setAlignTo] = createSignal<
    { poly: number; point: number } | undefined
  >();

  return (
    <>
      <For each={data.collisionObjects}>
        {(polygon, polygonIndex) => (
          <For each={polygon.points}>
            {(point, pointIndex) => (
              <button
                aria-label="delete point"
                classList={{
                  [styles.popoverButton]: true,
                  [styles.point]: true,
                }}
                style={{
                  left: `${point.x + PADDING}px`,
                  top: `${point.y + PADDING}px`,
                  "background-color":
                    alignTo()?.poly === polygonIndex() &&
                    alignTo()?.point === pointIndex()
                      ? "#8af"
                      : undefined,
                }}
                onClick={() => {
                  const alignToObj = alignTo();
                  if (alignToObj) {
                    const toPoint =
                      data.collisionObjects[alignToObj.poly].points[
                        alignToObj.point
                      ];
                    const xDist = Math.abs(toPoint.x - point.x);
                    const yDist = Math.abs(toPoint.y - point.y);
                    if (xDist < yDist) {
                      updateData(
                        "collisionObjects",
                        polygonIndex(),
                        "points",
                        pointIndex(),
                        { x: toPoint.x, y: point.y }
                      );
                    } else {
                      updateData(
                        "collisionObjects",
                        polygonIndex(),
                        "points",
                        pointIndex(),
                        { x: point.x, y: toPoint.y }
                      );
                    }

                    setAlignTo(undefined);
                  } else {
                    setAlignTo({ poly: polygonIndex(), point: pointIndex() });
                  }
                }}
              />
            )}
          </For>
        )}
      </For>
    </>
  );
}
