import { JSX, Show, createSignal } from "solid-js";
import { Meta, useParams, useRouteData } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import Game from "~/components/game/Game";
import { decodeHoleData, encodeReplayData } from "~/utils/url-utils";
import styles from "../play.module.css";
import { Launch } from "~/utils/GolfTypes";
import { createZoom } from "~/utils/zoom";
import { createServerData$ } from "solid-start/server";
import { CourseService } from "~/lib/course-service";

export function routeData() {
  return createServerData$(async () => {
    const params = useParams();
    return await CourseService.getInstance().getCourse(params.id);
  });
}

export default function Play() {
  const params = useParams();

  const course = useRouteData<typeof routeData>();

  const holeData = decodeHoleData(course()?.data);

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  let mainRef: HTMLElement;
  const [zoom, scrollTo, , zoomReady] = createZoom(
    () => mainRef,
    0,
    holeData.dimensions
  );

  const [score, setScore] = createSignal(0);
  const [recording, setRecording] = createSignal<Launch[][]>();

  let dialogRef: HTMLDialogElement;

  return (
    <>
      <Meta property="og:title" content="Golf!" />
      <Meta property="og:image" content="/ball.png" />
      <main
        ref={mainRef!}
        style={{
          "scrollbar-width": "none",
        }}
      >
        <Show when={zoomReady()}>
          <h1 class={styles.title}>{course()?.name}</h1>
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
            stage.reset();
            dialogRef.showModal();
            return true;
          }}
          launchRecord={recording() ?? undefined}
        />
        <dialog ref={dialogRef!} class={styles.dialog}>
          <p>You made it in</p>
          <p class={styles.score}>{score()}</p>
          <div class={styles.links}>
            <button
              onClick={async () => {
                const shareUrl =
                  window.location.origin +
                  `/watch/${params.id}?replay=${encodeReplayData(
                    recording()!
                  )}`;
                try {
                  await navigator.share({
                    title: "Golf",
                    text: "Hole in " + score() + "!",
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
            {course() && (
              <a target="_blank" href={`/editor?data=${course()!.data}`}>
                Remix
              </a>
            )}
            <a target="_blank" href="/editor">
              Make your Own
            </a>
            <a href="/portal">Browse</a>
          </div>
        </dialog>
      </main>
    </>
  );
}
