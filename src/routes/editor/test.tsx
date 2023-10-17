import {
  JSX,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { EditorContext } from "../editor";
import Stage from "~/utils/game/stage";
import styles from "../editor.module.css";
import { Controls } from "~/components/game/Controls";
import { BALL_RADIUS } from "~/utils/GolfConstants";

export default function TestMode() {
  const { data, setSvgBody } = useContext(EditorContext)!;
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

  const [svgChildren, setSvgChildren] = createSignal<JSX.Element>();

  createEffect(() => {
    setSvgBody(
      <>
        {svgChildren()}
        <circle
          cx={ballPos().x}
          cy={ballPos().y}
          r={BALL_RADIUS}
          fill="white"
          stroke="black"
        />
      </>
    );
  });

  return (
    <>
      <Controls
        launch={(angle, power) => stage.launchBall(0, angle, power)}
        ballLocation={ballPos()}
        disabled={false}
        frame={frame()}
        setSvgChildren={setSvgChildren}
      />
    </>
  );
}
