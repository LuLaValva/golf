import { JSX, Show, createSignal } from "solid-js";
import { Meta, useLocation, useSearchParams } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import Game from "~/components/game/Game";
import { decodeHoleData, encodeReplayData } from "~/utils/url-utils";
import styles from "./play.module.css";
import { Launch } from "~/utils/GolfTypes";
import { createZoom } from "~/utils/zoom";

export default function Play() {
  const [searchParams] = useSearchParams();
  const holeData = decodeHoleData(searchParams.data);
  const location = useLocation();

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  let mainRef: HTMLElement;
  const [zoom, scrollTo] = createZoom(() => mainRef, 0, holeData.dimensions);

  const [score, setScore] = createSignal(0);
  const [recording, setRecording] = createSignal<Launch[][]>();
  const [speed, setSpeed] = createSignal(1);

  let dialogRef: HTMLDialogElement;

  return (
    <>
      <Meta property="og:title" content="Golf!" />
      <Meta property="og:type" content="website" />
      <Meta property="og:image" content="/ball.png" />
      <Meta property="og:url" content={location.pathname + location.search} />
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
            setSpeed(1);
            stage.reset();
            dialogRef.showModal();
            return true;
          }}
          launchRecord={recording() ?? undefined}
          speed={speed()}
        />
        <dialog ref={dialogRef!} class={styles.dialog}>
          <p>You made it in</p>
          <p class={styles.score}>{score()}</p>
          <div class={styles.links}>
            <button
              onClick={async () => {
                const shareUrl =
                  window.location.origin +
                  `/watch?data=${searchParams.data}&replay=${encodeReplayData(
                    recording()!
                  )}`;
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
            <a target="_blank" href={`/editor?data=${searchParams.data}`}>
              Remix
            </a>
            <a target="_blank" href="/editor">
              Make your Own
            </a>
          </div>
        </dialog>
      </main>
    </>
  );
}
