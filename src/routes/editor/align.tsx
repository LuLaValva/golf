import { For, createSignal, useContext } from "solid-js";
import { EditorContext, PADDING } from "../editor";
import styles from "../editor.module.css";
import { BALL_RADIUS } from "~/utils/GolfConstants";

export default function PaintMode() {
  const { data, updateData, setSvgBody, zoom } = useContext(EditorContext)!;
  const [alignTo, setAlignTo] = createSignal<
    { poly: number; point: number } | undefined
  >();

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
