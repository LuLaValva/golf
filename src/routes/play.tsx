import { JSX, Show, createEffect, createSignal } from "solid-js";
import { useSearchParams } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import Game from "~/components/game/Game";
import { decodeHoleData, decodeReplayData } from "~/utils/url-utils";
import styles from "./play.module.css";

export default function Play() {
  const [searchParams] = useSearchParams();
  const holeData = decodeHoleData(searchParams.data);
  const replay = decodeReplayData(searchParams.replay);

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  const [maxZoom, setMaxZoom] = createSignal(0.1);
  const [zoom, setZoom] = createSignal(1);
  let mainRef: HTMLElement;

  function scrollToCenter(x: number, y: number) {
    mainRef.scrollTo({
      left: x * zoom() - mainRef.clientWidth / 2,
      top: y * zoom() - mainRef.clientHeight / 2,
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
    if (newZoom < maxZoom()) newZoom = maxZoom();
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

  function calculateMaxZoom() {
    if (typeof window !== "undefined") {
      const newMax = Math.max(
        window.innerHeight / holeData.dimensions.y,
        window.innerWidth / holeData.dimensions.x
      );
      setMaxZoom(newMax);
      if (zoom() < newMax) setZoom(newMax);
    }
  }

  createEffect(() => {
    calculateMaxZoom();
    window.addEventListener("resize", calculateMaxZoom);
  });

  const [score, setScore] = createSignal(0);
  const [finished, setFinished] = createSignal(false);

  return (
    <main ref={mainRef!} onWheel={handleWheel}>
      <svg
        viewBox={`0 0 ${holeData.dimensions.x} ${holeData.dimensions.y}`}
        width={holeData.dimensions.x * zoom()}
        height={holeData.dimensions.y * zoom()}
        class={styles.stage}
      >
        <CollisionDisplay objects={holeData.collisionObjects} />
        {svgBody()}
      </svg>
      <Game
        data={holeData}
        setSvgBody={setSvgBody}
        scrollTo={scrollToCenter}
        scrollRef={mainRef!}
        onScore={(stage) => {
          setScore(stage.getScore());
          setFinished(true);
        }}
      />
      <Show when={finished()}>
        <div class={styles.dialog}>
          <p>You made it in</p>
          <p class={styles.score}>{score()}</p>
          <p>stroke{score() === 1 ? "" : "s"}</p>
        </div>
      </Show>
    </main>
  );
}
