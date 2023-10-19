import {
  JSX,
  Setter,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";
import styles from "./Controls.module.css";
import { Point } from "~/utils/GolfTypes";

function pingPong(n: number, range: number) {
  return Math.abs(range - (n % (range * 2)));
}

const ROTATION_SPEED = 2;

interface Props {
  launch: (angle: number, power: number) => void;
  ballLocation: Point;
  disabled: boolean;
  frame: number;
  setSvgChildren: Setter<JSX.Element>;
}

export function Controls(props: Props) {
  const [angle, setAngle] = createSignal(-45);

  const [arrowRotate, setArrowRotate] = createSignal(0);
  const [power, setPower] = createSignal(0);

  const launch = () => {
    if (!props.disabled) props.launch((angle() / 180) * Math.PI, power());
  };

  const keydownListener = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        launch();
        setArrowRotate(0);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        setArrowRotate(-1);
        break;
      case "ArrowRight":
      case "ArrowDown":
        setArrowRotate(1);
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const keyupListener = (e: KeyboardEvent) => {
    switch (e.key) {
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
    setPower(pingPong(props.frame, 50) / 5 + 1);
    untrack(
      () =>
        props.disabled ||
        setAngle((angle) => angle + arrowRotate() * ROTATION_SPEED)
    );
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
        onClick={launch}
      >
        GO
      </button>
    </>
  );
}

interface ArrrowProps {
  angle: number;
  length: number;
  location: Point;
  disabled: boolean;
}

function Arrow(props: ArrrowProps) {
  return (
    <polygon
      class={props.disabled ? styles.fadeOut : undefined}
      points={`6,0 ${props.length},-2 ${props.length},-5 ${
        props.length + 8
      },0 ${props.length},5 ${props.length},2`}
      stroke="black"
      fill="#afa"
      transform={`translate(${props.location.x} ${props.location.y}) rotate(${props.angle} 0 0)`}
    />
  );
}
