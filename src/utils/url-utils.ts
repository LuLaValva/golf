import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { HoleData } from "./GolfTypes";

export function encodeHoleData(data: HoleData): string {
  return compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeHoleData(permalink?: string | null): HoleData {
  if (permalink) {
    return JSON.parse(decompressFromEncodedURIComponent(permalink));
  }
  return {
    collisionObjects: [
      {
        points: [
          { x: 200, y: 350 },
          { x: 200, y: 400 },
          { x: 400, y: 400 },
          { x: 400, y: 350 },
        ],
        segments: [0, 0, 0, 0],
      },
    ],
    startPos: { x: 250, y: 250 },
    dimensions: { x: 600, y: 600 },
  };
}
