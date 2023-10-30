import { createEffect, createSignal, useContext } from "solid-js";
import { EditorContext } from "../../routes/editor";
import Game from "~/components/game/Game";
import styles from "~/routes/play.module.css";
import { Launch } from "~/utils/GolfTypes";
import Stage from "~/utils/game/stage";
import { encodeHoleData } from "~/utils/url-utils";
import { createServerAction$, redirect } from "solid-start/server";
import { CourseService } from "~/lib/course-service";

export default function TestMode() {
  const { data, setSvgBody, scrollTo, mainRef } = useContext(EditorContext)!;

  const [submitting, { Form }] = createServerAction$(
    async (formData: FormData) => {
      await CourseService.getInstance().addCourse({
        name: formData.get("name") as string,
        data: formData.get("data") as string,
      });
      return "/portal";
    }
  );

  createEffect(() => {
    if (submitting.result) {
      window.location.href = submitting.result;
    }
  });

  const [recording, setRecording] = createSignal<Launch[][]>();

  const reset = () => {
    stageRef.clearReplay();
    setRecording(undefined);
  };

  let stageRef: Stage;
  let winDialogRef: HTMLDialogElement;
  let submitDialogRef: HTMLDialogElement;

  return (
    <>
      <Game
        data={data}
        setSvgBody={setSvgBody}
        scrollTo={scrollTo}
        scrollRef={mainRef}
        onScore={(stage) => {
          setRecording(stage.getReplay());
          stage.reset();
          stageRef = stage;
          if (!winDialogRef.open && !submitDialogRef.open) {
            winDialogRef.showModal();
          }
          return true;
        }}
        launchRecord={recording() ?? undefined}
      />
      <dialog class={styles.dialog} ref={winDialogRef!}>
        <p>Score!</p>
        <div class={styles.links}>
          <button
            onClick={() => {
              reset();
              winDialogRef.close();
            }}
          >
            Play Again
          </button>
          <button
            onClick={() => {
              winDialogRef.close();
              submitDialogRef.showModal();
            }}
          >
            Submit Course
          </button>
        </div>
      </dialog>
      <dialog class={styles.dialog} ref={submitDialogRef!}>
        <p>Submit Course</p>
        <Form>
          <input type="hidden" value={encodeHoleData(data)} name="data" />
          <p>
            <label for="course-name">Course Name:</label>
            <input id="course-name" type="text" name="name" required />
          </p>
          <div class={styles.links}>
            <button type="submit" disabled={submitting.pending}>
              Submit
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                submitDialogRef.close();
              }}
            >
              Cancel
            </button>
          </div>
        </Form>
      </dialog>
    </>
  );
}
