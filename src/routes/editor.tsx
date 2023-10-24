import {
  Accessor,
  For,
  JSX,
  Setter,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
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
  edit: { title: "edit", emoji: "🎛️" },
  tune: { title: "tune", emoji: "🔧" },
  draw: { title: "draw", emoji: "✏️" },
  paint: { title: "paint", emoji: "🎨" },
  erase: { title: "erase", emoji: "🧽" },
  align: { title: "align", emoji: "📐" },
  test: { title: "test", emoji: "🧪" },
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
  const current = () => useLocation().pathname.split("/")[2];

  return (
    <nav class={styles.nav}>
      <For each={Object.entries(tabs)}>
        {([id, info]) => {
          const labelId = "nav" + id;
          return (
            <div>
              <A
                href={"/editor/" + id + "?" + paramsAsString()}
                class={current() === id ? styles.active : undefined}
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
  );
}
