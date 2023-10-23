import { JSX, Show, createEffect, createSignal } from "solid-js";
import { useSearchParams } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import Game from "~/components/game/Game";
import {
  decodeHoleData,
  decodeReplayData,
  encodeReplayData,
} from "~/utils/url-utils";
import styles from "./play.module.css";
import controlStyles from "../components/game/Controls.module.css";
import { Launch } from "~/utils/GolfTypes";

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
  const [recording, setRecording] = createSignal<Launch[][]>();
  const [finished, setFinished] = createSignal(false);
  const [speed, setSpeed] = createSignal(1);

  return (
    <main
      ref={mainRef!}
      onWheel={handleWheel}
      style={{
        "scrollbar-width": "none",
      }}
    >
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
          setRecording(stage.getReplay());
          setFinished(true);
          setSpeed(1);
          stage.reset();
          return true;
        }}
        launchRecord={recording() ?? replay ?? undefined}
        speed={speed()}
      />
      <Show
        when={finished()}
        fallback={
          replay && (
            <>
              <div class={controlStyles.controls}>
                <button
                  classList={{
                    [controlStyles.controlButton]: true,
                    [controlStyles.speedButton]: true,
                  }}
                  onClick={() => setSpeed(1)}
                >
                  &gt;
                </button>
                <button
                  classList={{
                    [controlStyles.controlButton]: true,
                    [controlStyles.speedButton]: true,
                  }}
                  onClick={() => setSpeed(2)}
                >
                  &gt;&gt;
                </button>
                <button
                  classList={{
                    [controlStyles.controlButton]: true,
                    [controlStyles.speedButton]: true,
                  }}
                  onClick={() => setSpeed(4)}
                >
                  &gt;&gt;&gt;
                </button>
              </div>
            </>
          )
        }
      >
        <div class={styles.dialogScrim}>
          <div class={styles.dialog}>
            <p>{replay ? "They" : "You"} made it in</p>
            <p class={styles.score}>{score()}</p>
            <div class={styles.links}>
              {replay ? (
                <>
                  <a href={`/play?data=${searchParams.data}`}>Play</a>
                  <a
                    href={`/play?data=${searchParams.data}&replay=${searchParams.replay}`}
                  >
                    Watch Again
                  </a>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      const shareUrl =
                        window.location.origin +
                        `/play?data=${
                          searchParams.data
                        }&replay=${encodeReplayData(recording()!)}`;
                      try {
                        await navigator.share({
                          title: "Golf",
                          text: "Check out this replay!",
                          url: shareUrl,
                        });
                      } catch (e) {
                        await navigator.clipboard.writeText(shareUrl);
                        alert("Share link copied to clipboard");
                      }
                    }}
                  >
                    Share
                  </button>
                  <a
                    target="_blank"
                    href={`/editor/edit?data=${searchParams.data}`}
                  >
                    Remix
                  </a>
                  <a target="_blank" href="/editor/edit">
                    Make your Own
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </Show>
    </main>
  );
}
