import {
  For,
  JSX,
  Setter,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import Stage from "~/utils/game/stage";
import { Controls } from "~/components/game/Controls";
import { BALL_RADIUS } from "~/utils/GolfConstants";
import { manhattanDistance } from "~/utils/game/vector-utils";
import { HoleData, Launch } from "~/utils/GolfTypes";

const FRAME_RATE = 1000 / 50;

interface Props {
  data: HoleData;
  setSvgBody: Setter<JSX.Element>;
  scrollTo: (x: number, y: number) => void;
  scrollRef: HTMLElement;
  launchRecord?: Launch[][];
  onScore?: (stage: Stage) => boolean | void;
  speed?: number;
}

export default function Game(props: Props) {
  /**
   * GAME LOOP
   */
  const [ballPos, setBallPos] = createSignal(props.data.startPos);
  const [frame, setFrame] = createSignal(0);
  const stage = new Stage(props.data);

  let stillFrames = 0;
  const [canLaunch, setCanLaunch] = createSignal(false);
  const [puttMode, setPuttMode] = createSignal(false);

  let animFrame: ReturnType<typeof requestAnimationFrame>;
  let lastTimestamp = 0;
  const loop = (timestamp: number) => {
    let delta = timestamp - lastTimestamp;
    let continueLoop = true;
    if (delta > FRAME_RATE * 30) {
      delta = 0;
      lastTimestamp = timestamp;
    }
    if (delta > FRAME_RATE) {
      let currFrame = frame();
      if (props.speed) delta *= props.speed;
      while (delta > FRAME_RATE) {
        if (stage.update().length > 0) {
          continueLoop = props.onScore?.(stage) ?? false;
          setTrackBall(true);
        }
        delta -= FRAME_RATE;
        currFrame++;
      }
      lastTimestamp = timestamp;
      setFrame(currFrame);
      const newBallPos = stage.getBallPositions()[0];
      if (manhattanDistance(newBallPos, ballPos()) < 0.1) {
        if (++stillFrames > 8) {
          setCanLaunch(true);
        }
      } else {
        stillFrames = 0;
      }
      setBallPos({ ...stage.getBallPositions()[0] });
      setPuttMode(stage.isPuttMode());
    }
    if (continueLoop) animFrame = requestAnimationFrame(loop);
  };
  onCleanup(() => {
    if (typeof cancelAnimationFrame !== "undefined")
      cancelAnimationFrame?.(animFrame);
  });

  /**
   * SCROLL TRACKING
   */
  const [trackBall, setTrackBall] = createSignal(true);
  createEffect(() => {
    if (trackBall()) {
      props.scrollTo(ballPos().x, ballPos().y);
    }
  });

  function stopTracking(e: Event) {
    setTrackBall(false);
  }

  onMount(() => {
    props.scrollRef.addEventListener("touchmove", stopTracking);
    props.scrollRef.addEventListener("wheel", stopTracking);
    loop(0);
    onCleanup(() => {
      props.scrollRef?.removeEventListener("touchmove", stopTracking);
      props.scrollRef?.removeEventListener("wheel", stopTracking);
    });
  });

  /**
   * USER-FACING VISUALS
   */

  const [svgChildren, setSvgChildren] = createSignal<JSX.Element>();

  createEffect(() => {
    props.setSvgBody(
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

  createEffect(() => {
    if (props.launchRecord) {
      stage.replayLaunches(props.launchRecord);
    }
  });

  return (
    <>
      {!props.launchRecord && (
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
      )}
    </>
  );
}
