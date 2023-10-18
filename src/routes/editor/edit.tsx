import { For, createSignal, useContext } from "solid-js";
import MetadataPopover from "~/components/edit/MetadataPopover";
import { EditorContext, PADDING } from "../editor";
import styles from "../editor.module.css";
import { Point } from "~/utils/GolfTypes";

interface DragRoot {
  mouse: Point;
  point: Point;
}

export default function EditMode() {
  const { data, updateData, setSvgBody, zoom } = useContext(EditorContext)!;
  const [dragRoot, setDragRoot] = createSignal<DragRoot | null>(null);

  setSvgBody(<></>);

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
      x: Math.round(root.point.x + (e.clientX - root.mouse.x) / zoom()),
      y: Math.round(root.point.y + (e.clientY - root.mouse.y) / zoom()),
    };

    if (polygonIndex === -1) {
      updateData("startPos", newPos);
    } else if (polygonIndex === -2) {
      updateData("dimensions", newPos);
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
              left: `${(data.startPos.x + PADDING) * zoom()}px`,
              top: `${(data.startPos.y + PADDING) * zoom()}px`,
            }}
            onPointerDown={(e) => startDrag(e, data.startPos)}
            onPointerMove={(e) => dragMove(e, -1, -1)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        }
        title="Ball Position"
      >
        <div class={styles.inputGrid}>
          <label id="ball-x">X:</label>
          <input
            type="number"
            name="x"
            aria-labelledby="ball-x"
            value={data.startPos.x}
            onChange={(e) =>
              updateData("startPos", "x", +e.currentTarget.value)
            }
          />
          <label id="ball-y">Y:</label>
          <input
            type="number"
            aria-labelledby="ball-y"
            name="y"
            value={data.startPos.y}
            onChange={(e) =>
              updateData("startPos", "y", +e.currentTarget.value)
            }
          />{" "}
        </div>
      </MetadataPopover>
      <MetadataPopover
        inline={
          <button
            aria-label="edit stage dimensions"
            type="button"
            classList={{
              [styles.popoverButton]: true,
              [styles.dimensions]: true,
            }}
            style={{
              left: `${(data.dimensions.x + PADDING) * zoom()}px`,
              top: `${(data.dimensions.y + PADDING) * zoom()}px`,
            }}
            onPointerDown={(e) => startDrag(e, data.dimensions)}
            onPointerMove={(e) => dragMove(e, -2, -2)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        }
        title="Stage Dimensions"
      >
        <div class={styles.inputGrid}>
          <label id="stage-x">X:</label>
          <input
            type="number"
            name="x"
            aria-labelledby="ball-x"
            value={data.dimensions.x}
            onChange={(e) =>
              updateData("dimensions", "x", +e.currentTarget.value)
            }
          />
          <label id="stage-y">Y:</label>
          <input
            type="number"
            aria-labelledby="ball-y"
            name="y"
            value={data.dimensions.y}
            onChange={(e) =>
              updateData("dimensions", "y", +e.currentTarget.value)
            }
          />{" "}
        </div>
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
              const labelPrefix = `point${polygonIndex()}-${pointIndex()}`;
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
                          left: `${(point.x + PADDING) * zoom()}px`,
                          top: `${(point.y + PADDING) * zoom()}px`,
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
                    <div class={styles.inputGrid}>
                      <label id={labelPrefix + "-x"}>X:</label>
                      <input
                        type="number"
                        aria-labelledby={labelPrefix + "-x"}
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
                      <label id={labelPrefix + "-y"}>Y:</label>
                      <input
                        type="number"
                        name="y"
                        aria-labelledby={labelPrefix + "-y"}
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
                    </div>
                    <button
                      class={styles.delete}
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
                      left: `${(midpoint().x + PADDING) * zoom()}px`,
                      top: `${(midpoint().y + PADDING) * zoom()}px`,
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
