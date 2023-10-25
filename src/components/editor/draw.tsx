import { createMemo, useContext } from "solid-js";
import { EditorContext, PADDING } from "../../routes/editor";
import styles from "./editor.module.css";
import { BALL_RADIUS } from "~/utils/GolfConstants";

export default function DrawMode() {
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

  const incompletePolygonStart = createMemo(() => {
    if (data.collisionObjects.length === 0) return null;
    const lastPolygon = data.collisionObjects.at(-1)!;
    return lastPolygon.points.length === lastPolygon.segments.length
      ? null
      : lastPolygon.points[0];
  });

  const addPoint = (e: MouseEvent) => {
    const newPoint = {
      x: +e.offsetX / zoom() - PADDING,
      y: +e.offsetY / zoom() - PADDING,
    };
    if (!incompletePolygonStart()) {
      updateData("collisionObjects", (objects) => [
        ...objects,
        {
          points: [newPoint],
          segments: [],
        },
      ]);
    } else {
      updateData(
        "collisionObjects",
        data.collisionObjects.length - 1,
        "points",
        (points) => [...points, newPoint]
      );
      updateData(
        "collisionObjects",
        data.collisionObjects.length - 1,
        "segments",
        (segments) => [...segments, 0]
      );
    }
  };

  return (
    <>
      <input
        type="image"
        alt="add point"
        style={{
          width: `${(data.dimensions.x + PADDING * 2) * zoom()}px`,
          height: `${(data.dimensions.y + PADDING * 2) * zoom()}px`,
        }}
        onClick={addPoint}
      />
      {incompletePolygonStart() && (
        <button
          aria-label="complete polygon"
          classList={{
            [styles.popoverButton]: true,
            [styles.point]: true,
          }}
          style={{
            left: `${(incompletePolygonStart()!.x + PADDING) * zoom()}px`,
            top: `${(incompletePolygonStart()!.y + PADDING) * zoom()}px`,
          }}
          onClick={() =>
            updateData(
              "collisionObjects",
              data.collisionObjects.length - 1,
              "segments",
              (segments) => [...segments, 0]
            )
          }
        />
      )}
    </>
  );
}
