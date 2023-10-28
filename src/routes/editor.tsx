import {
  Accessor,
  For,
  JSX,
  Match,
  Setter,
  Switch,
  createContext,
  createEffect,
  createSignal,
} from "solid-js";
import { Title, useSearchParams } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import { HoleData } from "~/utils/GolfTypes";
import { decodeHoleData, encodeHoleData } from "~/utils/url-utils";
import styles from "~/components/editor/editor.module.css";
import { SetStoreFunction, createStore } from "solid-js/store";
import { createZoom } from "~/utils/zoom";
import EditMode from "~/components/editor/edit";
import TuneMode from "~/components/editor/tune";
import DrawMode from "~/components/editor/draw";
import PaintMode from "~/components/editor/paint";
import EraseMode from "~/components/editor/erase";
import AlignMode from "~/components/editor/align";
import TestMode from "~/components/editor/test";

const tabs = {
  edit: {
    title: "Edit",
    emoji: "🎛️",
    description:
      "Click and drag to move objects, including polygons and the ball. Resize the stage by dragging the bottom right corner.",
    Element: EditMode,
  },
  tune: {
    title: "Tune",
    emoji: "🔧",
    description:
      'Click and drag the red circles to move polygon vertices, and the white circle to move the ball. Fine tune by editing the numbers in the top right corner for each point. Use the green "+" buttons to add vertices.',
  },
  draw: {
    title: "Draw",
    emoji: "✏️",
    description:
      "Click anywhere to add a point. Complete a polygon by clicking on its initial point.",
  },
  paint: {
    title: "Paint",
    emoji: "🎨",
    description:
      "Select a surface type using the dropdown on the top, and click on the diamonds to change the surface type of the corresponding edge.",
  },
  erase: {
    title: "Erase",
    emoji: "🧽",
    description:
      'Click on a point to delete it. To delete entire polygons, switch to "edit" mode and use the "delete" button in its menu.',
  },
  align: {
    title: "Align",
    emoji: "📐",
    description:
      "Click on one point to select it, and another to align the first point with the second. To cancel, switch modes or click on the first point again.",
  },
  test: {
    title: "Test",
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
  const [zoom, scrollTo, changeZoom] = createZoom(() => mainRef, PADDING);
  const [currTab, setCurrTab] = createSignal<keyof typeof tabs>("edit");

  let debounceTimeout: NodeJS.Timeout | undefined;
  createEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const data = encodeHoleData(holeData);
    debounceTimeout = setTimeout(() => {
      setSearchParams({ data });
    }, 500);
  });

  return (
    <main ref={mainRef!} onWheel={(e) => e.ctrlKey && e.preventDefault()}>
      <Title>Editor</Title>

      <Navigation selected={currTab()} setSelected={setCurrTab} />
      <ZoomChangeButtons zoom={zoom()} changeZoom={changeZoom} />
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
        <Switch>
          <Match when={currTab() === "edit"}>
            <EditMode />
          </Match>
          <Match when={currTab() === "tune"}>
            <TuneMode />
          </Match>
          <Match when={currTab() === "draw"}>
            <DrawMode />
          </Match>
          <Match when={currTab() === "paint"}>
            <PaintMode />
          </Match>
          <Match when={currTab() === "erase"}>
            <EraseMode />
          </Match>
          <Match when={currTab() === "align"}>
            <AlignMode />
          </Match>
          <Match when={currTab() === "test"}>
            <TestMode />
          </Match>
        </Switch>
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

interface NavigationProps {
  selected: keyof typeof tabs;
  setSelected: Setter<keyof typeof tabs>;
}

function Navigation(props: NavigationProps) {
  let helpRef: HTMLDialogElement;

  return (
    <div class={styles.menu}>
      <nav>
        <For each={Object.entries(tabs)}>
          {([id, info]) => {
            const labelId = "nav" + id;
            return (
              <div>
                <button
                  onClick={() => props.setSelected(id as any)}
                  class={props.selected === id ? styles.active : undefined}
                  aria-labelledby={labelId}
                >
                  {info.emoji}
                </button>
                <label id={labelId}>{info.title}</label>
              </div>
            );
          }}
        </For>
      </nav>
      <div class={styles.help}>
        <button aria-label="help" onClick={() => helpRef.showModal()}>
          ?
        </button>
        <dialog
          ref={helpRef!}
          onClick={(e) => e.target === helpRef && helpRef.close()}
        >
          <div>
            <h1>{tabs[props.selected].title} mode</h1>
            <p>{tabs[props.selected].description}</p>
          </div>
        </dialog>
      </div>
    </div>
  );
}

interface ZoomChangeButtonsProps {
  zoom: number;
  changeZoom: (factor: number) => void;
}

function ZoomChangeButtons(props: ZoomChangeButtonsProps) {
  return (
    <div class={styles.zoomButtons}>
      <button onClick={() => props.changeZoom(0.3)}>+</button>
      <button onClick={() => props.changeZoom(-0.3)}>-</button>
    </div>
  );
}
