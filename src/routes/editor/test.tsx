import { createSignal, onCleanup, useContext } from "solid-js";
import { DataContext, PADDING } from "../editor";
import Stage from "~/utils/game/stage";
import styles from "../editor.module.css";
import { Controls } from "~/components/game/Controls";

export default function TestMode() {
  const [data] = useContext(DataContext)!;
  const [ballPos, setBallPos] = createSignal(data.startPos);
  const [frame, setFrame] = createSignal(0);
  const stage = new Stage(data);

  /** TODO: replace this with requestAnimationFrame and an interval counter */
  const interval = setInterval(() => {
    stage.update();
    setBallPos({ ...stage.getBallPositions()[0] });
    setFrame((frame) => frame + 1);
  }, 30);
  onCleanup(() => {
    clearInterval(interval);
  });

  return (
    <>
      <Controls
        launch={(angle, power) => stage.launchBall(0, angle, power)}
        ballLocation={ballPos()}
        disabled={false}
        frame={frame()}
      />
      <div
        classList={{
          [styles.gameElement]: true,
          [styles.ball]: true,
        }}
        style={{
          left: `${ballPos().x + PADDING}px`,
          top: `${ballPos().y + PADDING}px`,
        }}
      />
    </>
  );
}
