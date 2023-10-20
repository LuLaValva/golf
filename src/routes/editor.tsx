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
  const [zoom, setZoom] = createSignal(1);
  let mainRef: HTMLElement;

  createEffect(() => {
    setSearchParams({ data: encodeHoleData(holeData) });
  });

  function scrollToCenter(x: number, y: number) {
    mainRef.scrollTo({
      left: (x + PADDING) * zoom() - mainRef.clientWidth / 2,
      top: (y + PADDING) * zoom() - mainRef.clientHeight / 2,
      behavior: "auto",
    });
  }

  function changeZoom(
    changeBy: number,
    originX = mainRef.clientWidth / 2,
    originY = mainRef.clientHeight / 2
  ) {
    const oldZoom = zoom();
    let newZoom = oldZoom + changeBy;
    if (newZoom < 0.1) newZoom = 0.1;
    if (newZoom > 10) newZoom = 10;
    // update client scroll to match zoom
    const scale = newZoom / oldZoom;

    mainRef.scrollTo({
      left: mainRef.scrollLeft * scale + originX * scale - originX,
      top: mainRef.scrollTop * scale + originY * scale - originY,
      behavior: "auto",
    });
    setZoom(newZoom);
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = mainRef.getBoundingClientRect();
      changeZoom(
        -e.deltaY / 100,
        e.clientX - rect.left - window.scrollX,
        e.clientY - rect.top - window.scrollY
      );
    }
  }

  onMount(() => {
    document.addEventListener("wheel", handleWheel);
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("wheel", handleWheel);
    }
  });

  return (
    <main ref={mainRef!} onWheel={(e) => e.ctrlKey && e.preventDefault()}>
      <Title>Edit</Title>

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
          scrollTo: scrollToCenter,
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
      {/* <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="hsl(190, 100%, 90%)" />
          <stop offset="100%" stop-color="hsl(210, 100%, 90%)" />
        </linearGradient>
      </defs> */}
      <rect
        x={0}
        y={0}
        width={props.data.dimensions.x}
        height={props.data.dimensions.y}
        fill="#e4f8ff"
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
