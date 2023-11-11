import { JSX, Show, createSignal } from "solid-js";
import {
  Meta,
  redirect,
  unstable_clientOnly,
  useParams,
  useRouteData,
  useSearchParams,
} from "solid-start";
import Game from "~/components/game/Game";
import { decodeHoleData, decodeReplayData } from "~/utils/url-utils";
import styles from "../play.module.css";
import controlStyles from "../../components/game/Controls.module.css";
import { Launch } from "~/utils/GolfTypes";
import { createZoom } from "~/utils/zoom";
import { scoreFromLaunches } from "~/utils/game/stage";
import { createServerData$ } from "solid-start/server";
import { CourseService } from "~/lib/course-service";

const CollisionDisplay = unstable_clientOnly(
  () => import("~/components/CollisionDisplay")
);

export function routeData() {
  return createServerData$(async () => {
    const params = useParams();
    return await CourseService.getInstance().getCourse(params.id);
  });
}

export default function Watch() {
  const params = useParams();
  const course = useRouteData<typeof routeData>();

  const [searchParams] = useSearchParams();
  const holeData = decodeHoleData(course()?.data);
  const replay = decodeReplayData(searchParams.replay);
  if (!replay) {
    redirect("/play/" + params.id);
    return;
  }
  const sharedScore = scoreFromLaunches(replay[0]);

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  let mainRef: HTMLElement;
  const [zoom, scrollTo, , zoomReady] = createZoom(
    () => mainRef,
    0,
    holeData.dimensions
  );

  const [score, setScore] = createSignal(0);
  const [recording, setRecording] = createSignal<Launch[][]>();
  const [finished, setFinished] = createSignal(false);
  const [speed, setSpeed] = createSignal(1);

  let dialogRef: HTMLDialogElement;

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
        <Show when={zoomReady()}>
          <h1 class={styles.title}>Replay on "{course()?.name}"</h1>
          <svg
            viewBox={`0 0 ${holeData.dimensions.x} ${holeData.dimensions.y}`}
            width={holeData.dimensions.x * zoom()}
            height={holeData.dimensions.y * zoom()}
            class={styles.stage}
          >
            <CollisionDisplay
              objects={holeData.collisionObjects}
              stageDimensions={holeData.dimensions}
              startPos={holeData.startPos}
            />
            {svgBody()}
          </svg>
        </Show>
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

            dialogRef.showModal();
            return true;
          }}
          launchRecord={recording() ?? replay ?? undefined}
          speed={speed()}
        />
        <Show when={!finished()}>
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
        </Show>
        <dialog ref={dialogRef!} class={styles.dialog}>
          <p>They made it in</p>
          <p class={styles.score}>{score()}</p>
          <div class={styles.links}>
            <a href={`/play/${params.id}`}>Play</a>
            <a href={`/watch/${params.id}?replay=${searchParams.replay}`}>
              Watch Again
            </a>
          </div>
        </dialog>
      </main>
    </>
  );
}
