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
import { createZoom } from "~/utils/zoom";

export default function Play() {
  const [searchParams] = useSearchParams();
  const holeData = decodeHoleData(searchParams.data);
  const replay = decodeReplayData(searchParams.replay);

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  let mainRef: HTMLElement;
  const [zoom, scrollTo] = createZoom(() => mainRef, 0, holeData.dimensions);

  const [score, setScore] = createSignal(0);
  const [recording, setRecording] = createSignal<Launch[][]>();
  const [finished, setFinished] = createSignal(false);
  const [speed, setSpeed] = createSignal(1);

  return (
    <main
      ref={mainRef!}
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
        scrollTo={scrollTo}
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
        }
      >
        <div class={styles.dialogScrim}>
          <div class={styles.dialog}>
            <p>They made it in</p>
            <p class={styles.score}>{score()}</p>
            <div class={styles.links}>
              <a href={`/play?data=${searchParams.data}`}>Play</a>
              <a
                href={`/play?data=${searchParams.data}&replay=${searchParams.replay}`}
              >
                Watch Again
              </a>
            </div>
          </div>
        </div>
      </Show>
    </main>
  );
}
