import { For, createEffect, createSignal, useContext } from "solid-js";
import MetadataPopover from "~/components/edit/MetadataPopover";
import { DataContext, PADDING } from "../editor";
import styles from "../editor.module.css";
import { Point } from "~/utils/GolfTypes";

interface DragRoot {
  mouse: Point;
  point: Point;
}

export default function EditMode() {
  const [data, updateData] = useContext(DataContext)!;
  const [dragRoot, setDragRoot] = createSignal<DragRoot | null>(null);

  function startDrag(e: PointerEvent, point: Point) {
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    setDragRoot({
      mouse: { x: e.clientX, y: e.clientY },
      point: { ...point },
    });
  }

  function dragMove(e: PointerEvent, polygonIndex: number, pointIndex: number) {
    const root = dragRoot();
    if (!root) return;
    const newPos = {
      x: Math.round(root.point.x + e.clientX - root.mouse.x),
      y: Math.round(root.point.y + e.clientY - root.mouse.y),
    };

    if (polygonIndex === -1) {
      updateData("startPos", newPos);
    } else {
      updateData(
        "collisionObjects",
        polygonIndex,
        "points",
        pointIndex,
        newPos
      );
    }
  }

  function endDrag(e: PointerEvent) {
    (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
    setDragRoot(null);
  }

  return (
    <>
      <MetadataPopover
        inline={
          <button
            aria-label="edit ball position"
            type="button"
            classList={{
              [styles.popoverButton]: true,
              [styles.ball]: true,
            }}
            style={{
              left: `${data.startPos.x + PADDING}px`,
              top: `${data.startPos.y + PADDING}px`,
            }}
            onPointerDown={(e) => startDrag(e, data.startPos)}
            onPointerMove={(e) => dragMove(e, -1, -1)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        }
        title="Ball Position"
      >
        <label>
          X:
          <input
            type="number"
            name="x"
            value={data.startPos.x}
            onChange={(e) =>
              updateData("startPos", "x", +e.currentTarget.value)
            }
          />
        </label>
        <label>
          Y:
          <input
            type="number"
            name="y"
            value={data.startPos.y}
            onChange={(e) =>
              updateData("startPos", "y", +e.currentTarget.value)
            }
          />
        </label>
      </MetadataPopover>
      <For each={data.collisionObjects}>
        {(polygon, polygonIndex) => (
          <For each={polygon.points}>
            {(point, pointIndex) => {
              const nextPoint = () =>
                polygon.points[(pointIndex() + 1) % polygon.points.length];
              const midpoint = () => ({
                x: Math.round((point.x + nextPoint().x) / 2),
                y: Math.round((point.y + nextPoint().y) / 2),
              });
              return (
                <>
                  <MetadataPopover
                    inline={
                      <button
                        aria-label="edit point"
                        type="button"
                        classList={{
                          [styles.popoverButton]: true,
                          [styles.point]: true,
                        }}
                        style={{
                          left: `${point.x + PADDING}px`,
                          top: `${point.y + PADDING}px`,
                        }}
                        onPointerDown={(e) => startDrag(e, point)}
                        onPointerMove={(e) =>
                          dragMove(e, polygonIndex(), pointIndex())
                        }
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                      />
                    }
                    title="Point Details"
                  >
                    object {polygonIndex()}, point {pointIndex()}
                    <label>
                      X:
                      <input
                        type="number"
                        name="x"
                        value={point.x}
                        onChange={(e) =>
                          updateData(
                            "collisionObjects",
                            polygonIndex(),
                            "points",
                            pointIndex(),
                            "x",
                            +e.currentTarget.value
                          )
                        }
                      />
                    </label>
                    <label>
                      Y:
                      <input
                        type="number"
                        name="y"
                        value={point.y}
                        onChange={(e) =>
                          updateData(
                            "collisionObjects",
                            polygonIndex(),
                            "points",
                            pointIndex(),
                            "y",
                            +e.currentTarget.value
                          )
                        }
                      />
                    </label>
                    <button
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
                    >
                      Delete
                    </button>
                  </MetadataPopover>
                  <button
                    classList={{
                      [styles.popoverButton]: true,
                      [styles.addPoint]: true,
                    }}
                    name="add-point"
                    aria-label="add point"
                    style={{
                      left: `${midpoint().x + PADDING}px`,
                      top: `${midpoint().y + PADDING}px`,
                    }}
                    onClick={() => {
                      updateData(
                        "collisionObjects",
                        polygonIndex(),
                        "points",
                        (points) => [
                          ...points.slice(0, pointIndex() + 1),
                          midpoint(),
                          ...points.slice(pointIndex() + 1),
                        ]
                      );
                      updateData(
                        "collisionObjects",
                        polygonIndex(),
                        "segments",
                        (segments) => [
                          ...segments.slice(0, pointIndex() + 1),
                          polygon.segments[pointIndex()],
                          ...segments.slice(pointIndex() + 1),
                        ]
                      );
                    }}
                  >
                    +
                  </button>
                </>
              );
            }}
          </For>
        )}
      </For>
    </>
  );
}
