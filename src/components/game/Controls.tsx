import { Show, createEffect, createSignal, onCleanup, untrack } from "solid-js";
import styles from "./Controls.module.css";
import { Point } from "~/utils/GolfTypes";
import { PADDING } from "~/routes/editor";

interface Props {
  launch: (angle: number, power: number) => void;
  ballLocation: Point;
  disabled: boolean;
  frame: number;
}

function pingPong(n: number, range: number) {
  return Math.abs(range - (n % (range * 2)));
}

const ROTATION_SPEED = 2;

export function Controls(props: Props) {
  const [angle, setAngle] = createSignal(-45);

  const [arrowRotate, setArrowRotate] = createSignal(0);
  const [power, setPower] = createSignal(0);

  const launch = () => {
    props.launch((angle() / 180) * Math.PI, power());
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
        console.log(e.key);
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
    setPower(pingPong(props.frame, 30) / 2 + 2);
    untrack(() => setAngle((angle) => angle + arrowRotate() * ROTATION_SPEED));
  });

  const arrowLength = () => power() * 2 + 10;

  return (
    <>
      <svg
        style={{
          transform: `rotate(${angle()}deg)`,
          position: "absolute",
          left: (props.ballLocation.x + PADDING).toFixed(2),
          top: (props.ballLocation.y + PADDING).toFixed(2),
          overflow: "visible",
          "transform-origin": "top left",
        }}
      >
        <Show when={!props.disabled}>
          <polygon
            points={`8,0 ${arrowLength()},-3 ${arrowLength()},-7 ${
              arrowLength() + 10
            },0 ${arrowLength()},7 ${arrowLength()},3`}
            stroke="black"
            fill="#afa"
          />
        </Show>
      </svg>
      <div class={styles.controls}>
        <button
          class={styles.arrowButton}
          onPointerDown={() => setArrowRotate(-1)}
          onPointerCancel={() => setArrowRotate(0)}
          onPointerLeave={() => setArrowRotate(0)}
          onPointerUp={() => setArrowRotate(0)}
        >
          &larr;
        </button>
        <button
          class={styles.arrowButton}
          onPointerDown={() => setArrowRotate(1)}
          onPointerCancel={() => setArrowRotate(0)}
          onPointerLeave={() => setArrowRotate(0)}
          onPointerUp={() => setArrowRotate(0)}
        >
          &rarr;
        </button>
      </div>
      <button class={styles.launchButton} onClick={launch}>
        GO
      </button>
    </>
  );
}
