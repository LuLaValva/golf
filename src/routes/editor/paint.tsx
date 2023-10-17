import { For, createSignal, useContext } from "solid-js";
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
  const [paintType, setPaintType] = createSignal(CollisionType.NORMAL);

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
      <select
        class={styles.topMenu}
        onChange={(e) => {
          setPaintType(+e.currentTarget.value as CollisionType);
        }}
      >
        <For each={Object.entries(TYPE_TIITLES)}>
          {([type, title]) => <option value={type}>{title}</option>}
        </For>
      </select>
      <For each={data.collisionObjects}>
        {(polygon, polygonIndex) => (
          <For each={polygon.segments}>
            {(segmentType, i) => {
              const point1 = () => polygon.points[i()];
              const point2 = () =>
                polygon.points[(i() + 1) % polygon.points.length];
              const midpoint = () => scale(add(point1(), point2()), 0.5);
              return (
                <button
                  aria-label="change line type"
                  classList={{
                    [styles.popoverButton]: true,
                    [styles.line]: true,
                  }}
                  style={{
                    left: `${(midpoint().x + PADDING) * zoom()}px`,
                    top: `${(midpoint().y + PADDING) * zoom()}px`,
                    transform: `translate(-50%, -50%) rotate(${
                      Math.atan2(
                        point2().y - point1().y,
                        point2().x - point1().x
                      ) +
                      Math.PI / 4
                    }rad)`,
                    "border-color": STROKE_COLORS[segmentType],
                    "background-color": STROKE_COLORS[paintType()],
                  }}
                  onClick={() => {
                    updateData(
                      "collisionObjects",
                      polygonIndex(),
                      "segments",
                      i(),
                      () => paintType()
                    );
                  }}
                />
              );
            }}
          </For>
        )}
      </For>
    </>
  );
}
