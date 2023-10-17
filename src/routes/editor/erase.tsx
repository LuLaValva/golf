import { For, useContext } from "solid-js";
import { EditorContext, PADDING } from "../editor";
import styles from "../editor.module.css";
import { BALL_RADIUS, CollisionType } from "~/utils/GolfConstants";
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
  const { data, updateData, setSvgBody, zoom } = useContext(EditorContext)!;

  setSvgBody(
    <circle
      cx={data.startPos.x}
      cy={data.startPos.y}
      r={BALL_RADIUS}
      fill="white"
      stroke="black"
    />
  );

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
                  left: `${(point.x + PADDING) * zoom()}px`,
                  top: `${(point.y + PADDING) * zoom()}px`,
                }}
                onClick={() => {
                  if (polygon.points.length <= 3) {
                    updateData("collisionObjects", (polygons) => [
                      ...polygons.slice(0, polygonIndex()),
                      ...polygons.slice(polygonIndex() + 1),
                    ]);
                  } else {
                    updateData(
                      "collisionObjects",
                      polygonIndex(),
                      ["segments", "points"],
                      (items) =>
                        [
                          ...items.slice(0, pointIndex()),
                          ...items.slice(pointIndex() + 1),
                        ] as any
                    );
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
