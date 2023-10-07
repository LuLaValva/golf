import { For, JSX, createContext, createEffect, createMemo } from "solid-js";
import { Title, useSearchParams, Outlet, useLocation } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import { HoleData } from "~/utils/GolfTypes";
import { decodeHoleData, encodeHoleData } from "~/utils/url-utils";
import styles from "./editor.module.css";
import { SetStoreFunction, createStore } from "solid-js/store";
import { A, Params } from "@solidjs/router";

const tabs = {
  edit: { title: "edit" },
  draw: { title: "draw" },
  paint: { title: "paint" },
  erase: { title: "erase" },
  test: { title: "test" },
} as const;

export const PADDING = 100;

export const DataContext =
  createContext<[HoleData, SetStoreFunction<HoleData>]>();

export default function Editor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [holeData, updateHoleData] = createStore(
    decodeHoleData(searchParams.data)
  );

  createEffect(() => {
    setSearchParams({ data: encodeHoleData(holeData) });
  });

  return (
    <main>
      <Title>Edit</Title>

      <Navigation searchParams={searchParams} />
      <Stage data={holeData} />
      <DataContext.Provider value={[holeData, updateHoleData]}>
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
  const current = useLocation().pathname.split("/")[2];

  return (
    <nav class={styles.nav}>
      <For each={Object.entries(tabs)}>
        {([id, info]) => (
          <A href={"/editor/" + id + "?" + paramsAsString()}>{info.title}</A>
        )}
      </For>
    </nav>
  );
}
