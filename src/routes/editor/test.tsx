import {
  For,
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
import { FlagPosition } from "~/utils/GolfTypes";

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
  const [puttMode, setPuttMode] = createSignal(false);

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
        if (stage.update().length > 0) {
          stage.reset();
        }
        delta -= FRAME_RATE;
        currFrame++;
      }
      lastTimestamp = timestamp;
      setFrame(currFrame);
      const newBallPos = stage.getBallPositions()[0];
      if (manhattanDistance(newBallPos, ballPos()) < 0.05) {
        if (++stillFrames > 5) {
          setCanLaunch(true);
        }
      } else {
        stillFrames = 0;
      }
      setBallPos({ ...stage.getBallPositions()[0] });
      setPuttMode(stage.isPuttMode());
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
  const flagPositions = stage.getFlagPositions();

  createEffect(() => {
    setSvgBody(
      <>
        <For each={flagPositions}>{Flag}</For>
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
        puttMode={puttMode()}
      />
    </>
  );
}

function Flag(position: FlagPosition) {
  const transform = () =>
    `translate(${position.root.x} ${position.root.y}) rotate(${
      (Math.atan2(position.direction.y, position.direction.x) * 180) / Math.PI
    } 0 0)`;

  return (
    <>
      <ellipse rx="2" ry={BALL_RADIUS * 2} transform={transform()} />
      <polygon
        points="0,0 34,0 28,-14 22,-1 0,-1"
        fill="red"
        stroke="black"
        transform={transform()}
      />
    </>
  );
}
