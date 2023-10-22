import { JSX, createEffect, createSignal } from "solid-js";
import { useSearchParams } from "solid-start";
import CollisionDisplay from "~/components/CollisionDisplay";
import Game from "~/components/game/Game";
import { decodeHoleData } from "~/utils/url-utils";
import styles from "./play.module.css";

export default function Play() {
  const [searchParams] = useSearchParams();
  const data = decodeHoleData(searchParams.data);

  const [svgBody, setSvgBody] = createSignal<JSX.Element>();
  const [maxZoom, setMaxZoom] = createSignal(0.1);
  const [zoom, setZoom] = createSignal(1);
  let mainRef: HTMLElement;

  function scrollToCenter(x: number, y: number) {
    mainRef.scrollTo({
      left: x * zoom() - mainRef.clientWidth / 2,
      top: y * zoom() - mainRef.clientHeight / 2,
      behavior: "auto",
    });
  }

  function changeZoom(
    changeBy: number,
    originX = mainRef.clientWidth / 2,
    originY = mainRef.clientHeight / 2
  ) {
    const oldZoom = zoom();
    let newZoom = oldZoom + changeBy;
    if (newZoom < maxZoom()) newZoom = maxZoom();
    if (newZoom > 10) newZoom = 10;
    // update client scroll to match zoom
    const scale = newZoom / oldZoom;

    mainRef.scrollTo({
      left: mainRef.scrollLeft * scale + originX * scale - originX,
      top: mainRef.scrollTop * scale + originY * scale - originY,
      behavior: "auto",
    });
    setZoom(newZoom);
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = mainRef.getBoundingClientRect();
      changeZoom(
        -e.deltaY / 100,
        e.clientX - rect.left - window.scrollX,
        e.clientY - rect.top - window.scrollY
      );
    }
  }

  function calculateMaxZoom() {
    if (typeof window !== "undefined") {
      const newMax = Math.max(
        window.innerHeight / data.dimensions.y,
        window.innerWidth / data.dimensions.x
      );
      setMaxZoom(newMax);
      if (zoom() < newMax) setZoom(newMax);
    }
  }

  createEffect(() => {
    calculateMaxZoom();
    window.addEventListener("resize", calculateMaxZoom);
  });

  return (
    <main ref={mainRef!} onWheel={handleWheel}>
      <svg
        viewBox={`0 0 ${data.dimensions.x} ${data.dimensions.y}`}
        width={data.dimensions.x * zoom()}
        height={data.dimensions.y * zoom()}
        class={styles.stage}
      >
        <CollisionDisplay objects={data.collisionObjects} />
        {svgBody()}
      </svg>
      <Game
        data={data}
        setSvgBody={setSvgBody}
        scrollTo={scrollToCenter}
        scrollRef={mainRef!}
      />
    </main>
  );
}
