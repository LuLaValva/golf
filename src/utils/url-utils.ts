import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { HoleData, Launch } from "./GolfTypes";

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

function stringifyLaunch(launch: Launch): string {
  return (
    (launch.outOfBounds ? "1" : "0") +
    [
      launch.frame,
      launch.position.x,
      launch.position.y,
      launch.angle,
      launch.power,
    ].join(",")
  );
}

function launchFromString(str: string): Launch {
  const outOfBounds = str[0] === "1";
  const [frame, x, y, angle, power] = str
    .substring(1)
    .split(",")
    .map((x) => +x);
  return {
    outOfBounds,
    frame,
    position: { x, y },
    angle,
    power,
  };
}

export function encodeReplayData(launchRecords: Launch[][]) {
  return compressToEncodedURIComponent(
    launchRecords
      .map((record) => record.map(stringifyLaunch).join(";"))
      .join("|")
  );
}

export function decodeReplayData(permalink?: string): Launch[][] | null {
  if (permalink) {
    return decompressFromEncodedURIComponent(permalink)
      .split("|")
      .map((str) => str.split(";").map(launchFromString));
  }
  return null;
}
