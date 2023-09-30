import { createMemo, useContext } from "solid-js";
import { DataContext, PADDING } from "../editor";
import styles from "../editor.module.css";

export default function DrawMode() {
  const [data, updateData] = useContext(DataContext)!;

  const incompletePolygonStart = createMemo(() => {
    if (data.collisionObjects.length === 0) return null;
    const lastPolygon = data.collisionObjects.at(-1)!;
    return lastPolygon.points.length === lastPolygon.segments.length
      ? null
      : lastPolygon.points[0];
  });

  const addPoint = (e: MouseEvent) => {
    const newPoint = {
      x: +e.offsetX - PADDING,
      y: +e.offsetY - PADDING,
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
          width: `${data.dimensions.x + PADDING * 2}px`,
          height: `${data.dimensions.y + PADDING * 2}px`,
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
            left: `${incompletePolygonStart()!.x + PADDING}px`,
            top: `${incompletePolygonStart()!.y + PADDING}px`,
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
