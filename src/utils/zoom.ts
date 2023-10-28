import { createEffect, createSignal, onCleanup } from "solid-js";
import { Point } from "./GolfTypes";

export function createZoom(
  ref: () => HTMLElement,
  padding = 0,
  contain?: Point
) {
  const [zoom, setZoom] = createSignal(1);
  const [maxZoom, setMaxZoom] = createSignal(0.1);

  function scrollToCenter(x: number, y: number) {
    ref().scrollTo(
      (x + padding) * zoom() - ref().clientWidth / 2,
      (y + padding) * zoom() - ref().clientHeight / 2
    );
  }

  function changeZoom(
    changeBy: number,
    originX = ref().clientWidth / 2,
    originY = ref().clientHeight / 2
  ) {
    const oldZoom = zoom();
    let newZoom = oldZoom + changeBy;
    if (newZoom < maxZoom()) newZoom = maxZoom();
    if (newZoom > 10) newZoom = 10;
    setZoom(newZoom);

    // update client scroll to match zoom
    const scale = newZoom / oldZoom;
    const left = ref().scrollLeft;
    const top = ref().scrollTop;

    ref().scrollTo(
      left * scale + originX * scale - originX,
      top * scale + originY * scale - originY
    );
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = ref().getBoundingClientRect();
      changeZoom(-e.deltaY / 100, e.clientX - rect.left, e.clientY - rect.top);
    }
  }

  function calculateMaxZoom() {
    if (contain && typeof window !== "undefined") {
      const newMax = Math.max(
        window.innerHeight / contain.y,
        window.innerWidth / contain.x
      );
      setMaxZoom(newMax);
      if (zoom() < newMax) setZoom(newMax);
    }
  }

  createEffect(() => {
    document.addEventListener("wheel", handleWheel, { passive: false });
    calculateMaxZoom();
    window.addEventListener("resize", calculateMaxZoom);
    onCleanup(() => {
      document.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", calculateMaxZoom);
    });
  });

  return [zoom, scrollToCenter, changeZoom] as const;
}
