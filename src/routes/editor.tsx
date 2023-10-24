import {
  Accessor,
  For,
  JSX,
  Setter,
  createContext,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { Title, useSearchParams, Outlet, useLocation } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import { HoleData } from "~/utils/GolfTypes";
import { decodeHoleData, encodeHoleData } from "~/utils/url-utils";
import styles from "./editor.module.css";
import { SetStoreFunction, createStore } from "solid-js/store";
import { A, Params } from "@solidjs/router";
import { createZoom } from "~/utils/zoom";

const tabs = {
  edit: {
    title: "edit",
    emoji: "🎛️",
    description:
      "Click and drag to move objects, including polygons and the ball. Resize the stage by dragging the bottom right corner.",
  },
  tune: {
    title: "tune",
    emoji: "🔧",
    description:
      'Click and drag the red circles to move polygon vertices, and the white circle to move the ball. Fine tune by editing the numbers in the top right corner for each point. Use the green "+" buttons to add vertices.',
  },
  draw: {
    title: "draw",
    emoji: "✏️",
    description:
      "Click anywhere to add a point. Complete a polygon by clicking on its initial point.",
  },
  paint: {
    title: "paint",
    emoji: "🎨",
    description:
      "Select a surface type using the dropdown on the top, and click on the diamonds to change the surface type of the corresponding edge.",
  },
  erase: {
    title: "erase",
    emoji: "🧽",
    description:
      'Click on a point to delete it. To delete entire polygons, switch to "edit" mode and use the "delete" button in its menu.',
  },
  align: {
    title: "align",
    emoji: "📐",
    description:
      "Click on one point to select it, and another to align the first point with the second. To cancel, switch modes or click on the first point again.",
  },
  test: {
    title: "test",
    emoji: "🧪",
    description:
      "Test the game out as it will be played. Use the buttons on the screen or the arrow keys & space bar to play.",
  },
} as const;

export const PADDING = 100;

export const EditorContext = createContext<{
  data: HoleData;
  updateData: SetStoreFunction<HoleData>;
  setSvgBody: Setter<JSX.Element>;
  zoom: Accessor<number>;
  scrollTo: (x: number, y: number) => void;
  mainRef: HTMLElement;
}>();

export default function Editor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [holeData, updateHoleData] = createStore(
    decodeHoleData(searchParams.data)
  );
  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  let mainRef: HTMLElement;
  const [zoom, scrollTo] = createZoom(() => mainRef, PADDING);

  createEffect(() => {
    setSearchParams({ data: encodeHoleData(holeData) });
  });

  return (
    <main ref={mainRef!} onWheel={(e) => e.ctrlKey && e.preventDefault()}>
      <Title>Editor</Title>

      <Navigation searchParams={searchParams} />
      <Stage data={holeData} zoom={zoom()}>
        {svgBody()}
      </Stage>
      <EditorContext.Provider
        value={{
          data: holeData,
          updateData: updateHoleData,
          setSvgBody,
          zoom,
          scrollTo,
          mainRef: mainRef!,
        }}
      >
        <Outlet />
      </EditorContext.Provider>
    </main>
  );
}

interface StageProps {
  data: HoleData;
  zoom: number;
  children?: JSX.Element;
}

function Stage(props: StageProps) {
  const padWidth = () => props.data.dimensions.x + PADDING * 2;
  const padHeight = () => props.data.dimensions.y + PADDING * 2;
  return (
    <svg
      viewBox={`${-PADDING} ${-PADDING} ${padWidth()} ${padHeight()}`}
      width={padWidth() * props.zoom}
      height={padHeight() * props.zoom}
      class={styles.stage}
    >
      <rect
        x={0}
        y={0}
        width={props.data.dimensions.x}
        height={props.data.dimensions.y}
        fill="var(--stage-background)"
      />
      <CollisionDisplay objects={props.data.collisionObjects} />
      {props.children}
    </svg>
  );
}

function Navigation(props: { searchParams: Params }) {
  const paramsAsString = createMemo(() =>
    new URLSearchParams(props.searchParams).toString()
  );
  const current = createMemo(
    () => tabs[useLocation().pathname.split("/")[2] as keyof typeof tabs]
  );

  return (
    <div class={styles.menu}>
      <nav>
        <For each={Object.entries(tabs)}>
          {([id, info]) => {
            const labelId = "nav" + id;
            return (
              <div>
                <A
                  href={"/editor/" + id + "?" + paramsAsString()}
                  class={
                    current().title === info.title ? styles.active : undefined
                  }
                  aria-labelledby={labelId}
                >
                  {info.emoji}
                </A>
                <label id={labelId}>{info.title}</label>
              </div>
            );
          }}
        </For>
      </nav>
      <div class={styles.help}>
        <button aria-label="help">?</button>
        <div>
          <h1>Help</h1>
          <h2>{current().title} mode</h2>
          <p>{current().description}</p>
        </div>
      </div>
    </div>
  );
}
