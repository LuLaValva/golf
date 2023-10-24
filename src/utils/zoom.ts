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
    ref().scrollTo({
      left: (x + padding) * zoom() - ref().clientWidth / 2,
      top: (y + padding) * zoom() - ref().clientHeight / 2,
      behavior: "auto",
    });
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
    // update client scroll to match zoom
    const scale = newZoom / oldZoom;

    ref().scrollTo({
      left: ref().scrollLeft * scale + originX * scale - originX,
      top: ref().scrollTop * scale + originY * scale - originY,
      behavior: "auto",
    });
    setZoom(newZoom);
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = ref().getBoundingClientRect();
      changeZoom(
        -e.deltaY / 100,
        e.clientX - rect.left - window.scrollX,
        e.clientY - rect.top - window.scrollY
      );
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

  return [zoom, scrollToCenter] as const;
}
