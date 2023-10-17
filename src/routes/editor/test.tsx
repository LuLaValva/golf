import {
  JSX,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { EditorContext } from "../editor";
import Stage from "~/utils/game/stage";
import { Controls } from "~/components/game/Controls";
import { BALL_RADIUS } from "~/utils/GolfConstants";
import { manhattanDistance } from "~/utils/game/vector-utils";

const FRAME_RATE = 1000 / 60;

export default function TestMode() {
  const { data, setSvgBody, scrollTo, mainRef } = useContext(EditorContext)!;

  /**
   * GAME LOOP
   */
  const [ballPos, setBallPos] = createSignal(data.startPos);
  const [frame, setFrame] = createSignal(0);
  const stage = new Stage(data);

  let stillFrames = 0;
  const [canLaunch, setCanLaunch] = createSignal(false);

  let animFrame: ReturnType<typeof requestAnimationFrame>;
  let lastTimestamp = 0;
  const loop = (timestamp: number) => {
    let delta = timestamp - lastTimestamp;
    if (delta > FRAME_RATE * 300) {
      delta = 0;
      lastTimestamp = timestamp;
    }
    if (delta > FRAME_RATE) {
      let currFrame = frame();
      while (delta > FRAME_RATE) {
        stage.update();
        delta -= FRAME_RATE;
        currFrame++;
      }
      lastTimestamp = timestamp;
      setFrame(currFrame);
      const newBallPos = stage.getBallPositions()[0];
      if (manhattanDistance(newBallPos, ballPos()) < 0.1) {
        if (++stillFrames > 5) {
          setCanLaunch(true);
        }
      } else {
        stillFrames = 0;
      }
      setBallPos({ ...stage.getBallPositions()[0] });
    }
    animFrame = requestAnimationFrame(loop);
  };
  onCleanup(() => {
    if (typeof cancelAnimationFrame !== "undefined")
      cancelAnimationFrame?.(animFrame);
  });

  /**
   * SCROLL TRACKING
   */
  const [trackBall, setTrackBall] = createSignal(true);
  let programmaticScroll = false;
  createEffect(() => {
    if (trackBall()) {
      programmaticScroll = true;
      scrollTo(ballPos().x, ballPos().y);
    }
  });

  function stopTracking() {
    if (!programmaticScroll) setTrackBall(false);
    else programmaticScroll = false;
  }

  onMount(() => {
    mainRef.addEventListener("click", stopTracking);
    mainRef.addEventListener("scroll", stopTracking);
    loop(0);
  });

  onCleanup(() => {
    mainRef?.removeEventListener("click", stopTracking);
    mainRef?.removeEventListener("scroll", stopTracking);
  });

  /**
   * USER-FACING VISUALS
   */

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
        launch={(angle, power) => {
          stage.launchBall(0, angle, power);
          setCanLaunch(false);
          setTrackBall(true);
        }}
        ballLocation={ballPos()}
        disabled={!canLaunch()}
        frame={frame()}
        setSvgChildren={setSvgChildren}
      />
    </>
  );
}
