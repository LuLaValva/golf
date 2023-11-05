import { For, createMemo, createSignal, useContext } from "solid-js";
import MetadataPopover from "~/components/editor/edit/MetadataPopover";
import { EditorContext, PADDING } from "../../routes/editor";
import styles from "./editor.module.css";
import { Point } from "~/utils/GolfTypes";
import { BALL_RADIUS } from "~/utils/GolfConstants";

type DragRoot = { mouse: Point } & (
  | {
      point: Point;
    }
  | {
      points: Point[];
    }
);

export default function EditMode() {
  const { data, updateData, setSvgBody, zoom } = useContext(EditorContext)!;
  const [dragRoot, setDragRoot] = createSignal<DragRoot | null>(null);

  setSvgBody(
    <circle
      cx={data.startPos.x}
      cy={data.startPos.y}
      r={BALL_RADIUS}
      fill="white"
      stroke="black"
    />
  );

  function startDrag(e: PointerEvent, dragging: Point | Point[]) {
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    setDragRoot(
      Array.isArray(dragging)
        ? {
            mouse: { x: e.clientX, y: e.clientY },
            points: [...dragging],
          }
        : {
            mouse: { x: e.clientX, y: e.clientY },
            point: { ...dragging },
          }
    );
  }

  function dragMove(e: PointerEvent, polygonIndex: number) {
    const root = dragRoot();
    if (!root) return;
    if ("points" in root) {
      const newPos = root.points.map((point) => ({
        x: Math.round(point.x + (e.clientX - root.mouse.x) / zoom()),
        y: Math.round(point.y + (e.clientY - root.mouse.y) / zoom()),
      }));
      if (
        newPos.some(
          (point) =>
            point.x < -PADDING ||
            point.y < -PADDING ||
            point.x > data.dimensions.x + PADDING ||
            point.y > data.dimensions.y + PADDING
        )
      )
        return;

      updateData("collisionObjects", polygonIndex, "points", newPos);
      return;
    } else {
      const newPos = {
        x: Math.round(root.point.x + (e.clientX - root.mouse.x) / zoom()),
        y: Math.round(root.point.y + (e.clientY - root.mouse.y) / zoom()),
      };

      if (
        newPos.x < -PADDING ||
        newPos.y < -PADDING ||
        newPos.x > data.dimensions.x + PADDING ||
        newPos.y > data.dimensions.y + PADDING
      )
        return;
      if (polygonIndex === -1) {
        updateData("startPos", newPos);
      } else if (polygonIndex === -2) {
        updateData("dimensions", newPos);
      }
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
              [styles.draggable]: true,
              [styles.ball]: true,
            }}
            style={{
              left: `${(data.startPos.x + PADDING) * zoom()}px`,
              top: `${(data.startPos.y + PADDING) * zoom()}px`,
            }}
            onPointerDown={(e) => startDrag(e, data.startPos)}
            onPointerMove={(e) => dragMove(e, -1)}
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
            min={-PADDING}
            max={data.dimensions.x + PADDING}
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
            min={-PADDING}
            max={data.dimensions.y + PADDING}
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
              [styles.draggable]: true,
              [styles.dimensions]: true,
            }}
            style={{
              left: `${(data.dimensions.x + PADDING) * zoom()}px`,
              top: `${(data.dimensions.y + PADDING) * zoom()}px`,
            }}
            onPointerDown={(e) => startDrag(e, data.dimensions)}
            onPointerMove={(e) => dragMove(e, -2)}
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
        {(polygon, polygonIndex) => {
          const midpoint = createMemo(() => {
            const { min, max } = polygon.points.reduce(
              (acc, point) => ({
                min: {
                  x: Math.min(acc.min.x, point.x),
                  y: Math.min(acc.min.y, point.y),
                },
                max: {
                  x: Math.max(acc.max.x, point.x),
                  y: Math.max(acc.max.y, point.y),
                },
              }),
              {
                min: { x: Infinity, y: Infinity },
                max: { x: -Infinity, y: -Infinity },
              }
            );
            return {
              x: (min.x + max.x) / 2,
              y: (min.y + max.y) / 2,
            };
          });
          const labelPrefix = `polygon${polygonIndex()}`;
          return (
            <>
              <MetadataPopover
                inline={
                  <button
                    aria-label="edit polygon"
                    type="button"
                    classList={{
                      [styles.popoverButton]: true,
                      [styles.draggable]: true,
                      [styles.polygon]: true,
                    }}
                    style={{
                      left: `${(midpoint().x + PADDING) * zoom()}px`,
                      top: `${(midpoint().y + PADDING) * zoom()}px`,
                    }}
                    onPointerDown={(e) => startDrag(e, polygon.points)}
                    onPointerMove={(e) => dragMove(e, polygonIndex())}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  />
                }
                title="Polygon Details"
              >
                <button
                  class={styles.delete}
                  onClick={() => {
                    updateData("collisionObjects", (polygons) => [
                      ...polygons.slice(0, polygonIndex()),
                      ...polygons.slice(polygonIndex() + 1),
                    ]);
                  }}
                >
                  Delete
                </button>
              </MetadataPopover>
            </>
          );
        }}
      </For>
    </>
  );
}
