import {
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

const tabs = {
  draw: { title: "draw", emoji: "✏️" },
  paint: { title: "paint", emoji: "🎨" },
  erase: { title: "erase", emoji: "🧽" },
  align: { title: "align", emoji: "⚖️" },
  edit: { title: "edit", emoji: "✍️" },
  test: { title: "test", emoji: "🧪" },
} as const;

export const PADDING = 100;

export const DataContext =
  createContext<[HoleData, SetStoreFunction<HoleData>, Setter<JSX.Element>]>();

export default function Editor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [holeData, updateHoleData] = createStore(
    decodeHoleData(searchParams.data)
  );
  const [stageBody, setStageBody] = createSignal<JSX.Element>();

  createEffect(() => {
    setSearchParams({ data: encodeHoleData(holeData) });
  });

  return (
    <main>
      <Title>Edit</Title>

      <Navigation searchParams={searchParams} />
      <Stage data={holeData}>{stageBody()}</Stage>
      <DataContext.Provider value={[holeData, updateHoleData, setStageBody]}>
        <Outlet />
      </DataContext.Provider>
    </main>
  );
}

interface StageProps {
  data: HoleData;
  children?: JSX.Element;
}

function Stage(props: StageProps) {
  return (
    <svg
      width={props.data.dimensions.x + PADDING * 2}
      height={props.data.dimensions.y + PADDING * 2}
      class={styles.stage}
    >
      <rect
        x={PADDING}
        y={PADDING}
        width={props.data.dimensions.x}
        height={props.data.dimensions.y}
        fill="white"
      />
      <CollisionDisplay
        objects={props.data.collisionObjects}
        padding={PADDING}
      />
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
