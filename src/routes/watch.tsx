import { JSX, Show, createSignal } from "solid-js";
import { Meta, redirect, useSearchParams } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import Game from "~/components/game/Game";
import { decodeHoleData, decodeReplayData } from "~/utils/url-utils";
import styles from "./play.module.css";
import controlStyles from "../components/game/Controls.module.css";
import { Launch } from "~/utils/GolfTypes";
import { createZoom } from "~/utils/zoom";
import { scoreFromLaunches } from "~/utils/game/stage";

export default function Play() {
  const [searchParams] = useSearchParams();
  const holeData = decodeHoleData(searchParams.data);
  const replay = decodeReplayData(searchParams.replay);
  if (!replay) {
    redirect("/play?data=" + searchParams.data);
    return;
  }
  const sharedScore = scoreFromLaunches(replay[0]);

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  let mainRef: HTMLElement;
  const [zoom, scrollTo] = createZoom(() => mainRef, 0, holeData.dimensions);

  const [score, setScore] = createSignal(0);
  const [recording, setRecording] = createSignal<Launch[][]>();
  const [finished, setFinished] = createSignal(false);
  const [speed, setSpeed] = createSignal(1);

  return (
    <>
      <Meta property="og:title" content={`Hole in ${sharedScore}!`} />
      <Meta property="og:type" content="website" />
      <Meta
        property="og:image"
        content={`/scores/ball${sharedScore > 99 ? "99+" : sharedScore}.png`}
      />
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
                    [controlStyles.active]: speed() === 1,
                  }}
                  onClick={() => setSpeed(1)}
                >
                  &gt;
                </button>
                <button
                  classList={{
                    [controlStyles.controlButton]: true,
                    [controlStyles.speedButton]: true,
                    [controlStyles.active]: speed() === 2,
                  }}
                  onClick={() => setSpeed(2)}
                >
                  &gt;&gt;
                </button>
                <button
                  classList={{
                    [controlStyles.controlButton]: true,
                    [controlStyles.speedButton]: true,
                    [controlStyles.active]: speed() === 4,
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
                  href={`/watch?data=${searchParams.data}&replay=${searchParams.replay}`}
                >
                  Watch Again
                </a>
              </div>
            </div>
          </div>
        </Show>
      </main>
    </>
  );
}
