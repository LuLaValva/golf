import {
  JSX,
  Setter,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";
import styles from "./Controls.module.css";
import { Point } from "~/utils/GolfTypes";

function pingPong(n: number, range: number) {
  return range - Math.abs(range - (n % (range * 2)));
}

const ROTATION_SPEED = 2;

interface Props {
  launch: (angle: number, power: number) => void;
  ballLocation: Point;
  disabled: boolean;
  frame: number;
  setSvgChildren: Setter<JSX.Element>;
  puttMode: boolean;
}

export function Controls(props: Props) {
  const [angle, setAngle] = createSignal(-45);

  const [arrowRotate, setArrowRotate] = createSignal(0);
  const [power, setPower] = createSignal(0);
  const [startPower, setStartPower] = createSignal<number | null>(null);

  const startLaunch = () => {
    if (!props.disabled && startPower() === null) {
      setStartPower(props.frame);
    }
  };

  const launch = () => {
    if (!props.disabled && startPower() !== null) {
      props.launch(
        (angle() / 180) * Math.PI,
        power() * (props.puttMode ? 0.5 : 1)
      );
      setStartPower(null);
    }
  };

  const keydownListener = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        startLaunch();
        break;
      case "ArrowLeft":
      case "ArrowDown":
        setArrowRotate(-1);
        break;
      case "ArrowRight":
      case "ArrowUp":
        setArrowRotate(1);
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const keyupListener = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        launch();
        setArrowRotate(0);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "ArrowRight":
      case "ArrowDown":
        setArrowRotate(0);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  createEffect(() => {
    document.addEventListener("keydown", keydownListener);
    document.addEventListener("keyup", keyupListener);
    onCleanup(() => {
      document.removeEventListener("keydown", keydownListener);
      document.removeEventListener("keyup", keyupListener);
    });
  });

  createEffect(() => {
    if (!props.disabled) {
      const frame = props.frame;
      if (startPower() !== null) {
        setPower(pingPong(frame - startPower()!, 50) / 5 + 1);
      }
      untrack(() => {
        if (props.puttMode) {
          if (arrowRotate() > 0) {
            setAngle(0);
          } else if (arrowRotate() < 0) {
            setAngle(180);
          } else if (angle() !== 180) {
            setAngle(0);
          }
        } else {
          setAngle((angle) => angle + arrowRotate() * ROTATION_SPEED);
        }
      });
    }
  });

  createEffect(() => {
    if (props.disabled) setArrowRotate(0);
  });

  const [arrowPosition, setArrowPosition] = createSignal(props.ballLocation);
  const [arrowLength, setArrowLength] = createSignal(0);
  createEffect(() => {
    if (!props.disabled) {
      setArrowPosition(props.ballLocation);
      setArrowLength(power() * 2 + 10);
    }
  });

  createEffect(() => {
    props.setSvgChildren(
      <Arrow
        length={arrowLength()}
        angle={angle()}
        location={arrowPosition()}
        disabled={props.disabled}
        justAiming={startPower() === null}
      />
    );
  });

  return (
    <>
      <div class={styles.controls}>
        <button
          disabled={props.disabled}
          classList={{
            [styles.controlButton]: true,
            [styles.arrowButton]: true,
          }}
          onPointerDown={() => setArrowRotate(-1)}
          onPointerCancel={() => setArrowRotate(0)}
          onPointerLeave={() => setArrowRotate(0)}
          onPointerUp={() => setArrowRotate(0)}
        >
          &larr;
        </button>
        <button
          disabled={props.disabled}
          classList={{
            [styles.controlButton]: true,
            [styles.arrowButton]: true,
          }}
          onPointerDown={() => setArrowRotate(1)}
          onPointerCancel={() => setArrowRotate(0)}
          onPointerLeave={() => setArrowRotate(0)}
          onPointerUp={() => setArrowRotate(0)}
        >
          &rarr;
        </button>
      </div>
      <button
        disabled={props.disabled}
        classList={{
          [styles.controlButton]: true,
          [styles.launchButton]: true,
        }}
        onPointerDown={startLaunch}
        onPointerUp={launch}
      >
        GO
      </button>
    </>
  );
}

interface ArrowProps {
  angle: number;
  length: number;
  location: Point;
  disabled: boolean;
  justAiming: boolean;
}

function Arrow(props: ArrowProps) {
  const whiteArrow = () => props.justAiming && !props.disabled;
  const length = createMemo(() => (whiteArrow() ? 12 : props.length));
  return (
    <>
      <path
        class={props.disabled ? styles.fadeOut : undefined}
        d="M32 -5L40 0L32 5"
        stroke="#888888"
        fill="none"
        opacity={0.4}
        transform={`translate(${props.location.x} ${props.location.y}) rotate(${props.angle} 0 0)`}
      />
      <polygon
        class={props.disabled ? styles.fadeOut : undefined}
        points={`6,0 ${length()},-2 ${length()},-5 ${
          length() + 8
        },0 ${length()},5 ${length()},2`}
        stroke="var(--accent-stroke)"
        fill={whiteArrow() ? "#fff" : `hsl(${120 - length() * 3}, 100%, 50%)`}
        transform={`translate(${props.location.x} ${props.location.y}) rotate(${props.angle} 0 0)`}
      />
    </>
  );
}
