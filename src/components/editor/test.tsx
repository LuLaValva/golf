import { createSignal, useContext } from "solid-js";
import { EditorContext } from "../../routes/editor";
import Game from "~/components/game/Game";
import styles from "~/routes/play.module.css";
import { Launch } from "~/utils/GolfTypes";
import Stage from "~/utils/game/stage";
import { encodeHoleData } from "~/utils/url-utils";

export default function TestMode() {
  const { data, setSvgBody, scrollTo, mainRef } = useContext(EditorContext)!;

  const [recording, setRecording] = createSignal<Launch[][]>();

  let stageRef: Stage;
  let dialogRef: HTMLDialogElement;
  return (
    <>
      <Game
        data={data}
        setSvgBody={setSvgBody}
        scrollTo={scrollTo}
        scrollRef={mainRef}
        onScore={(stage) => {
          setRecording(stage.getReplay());
          dialogRef.showModal();
          stage.reset();
          stageRef = stage;
          return true;
        }}
        launchRecord={recording() ?? undefined}
      />
      <dialog class={styles.dialog} ref={dialogRef!}>
        <p>Score!</p>
        <div class={styles.links}>
          <button
            onClick={() => {
              stageRef.clearReplay();
              setRecording(undefined);
              dialogRef.close();
            }}
          >
            Play Again
          </button>
          <button
            onClick={async () => {
              const shareUrl =
                window.location.origin + `/play?data=${encodeHoleData(data)}`;
              try {
                await navigator.share({
                  title: "Golf",
                  text: "Check out this course I made!",
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
        </div>
      </dialog>
    </>
  );
}
