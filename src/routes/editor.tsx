import { For, JSX, createContext, createEffect } from "solid-js";
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

function ModeControl(props: {
  id: string;
  title: string;
  children: JSX.Element;
}) {
  return (
    <>
      <input type="radio" name="mode" id={props.id} />
      <label for={props.id}>{props.title}</label>
      <div class={styles.modeBody}>{props.children}</div>
    </>
  );
}

interface StageProps {
  data: HoleData;
  children?: JSX.Element;
}

function Stage({ data, children }: StageProps) {
  return (
    <svg
      width={data.dimensions.x + PADDING * 2}
      height={data.dimensions.y + PADDING * 2}
      class={styles.stage}
    >
      <rect
        x={PADDING}
        y={PADDING}
        width={data.dimensions.x}
        height={data.dimensions.y}
        fill="white"
      />
      <CollisionDisplay objects={data.collisionObjects} padding={PADDING} />
      {children}
    </svg>
  );
}

function Navigation({ searchParams }: { searchParams: Params }) {
  const paramsAsString = new URLSearchParams(searchParams).toString();
  const current = useLocation().pathname.split("/")[2];

  return (
    <nav class={styles.nav}>
      <For each={Object.entries(tabs)}>
        {([id, info]) => (
          <A href={"/editor/" + id + "?" + paramsAsString}>{info.title}</A>
        )}
      </For>
    </nav>
  );
}
