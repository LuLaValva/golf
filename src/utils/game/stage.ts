import { CollisionType } from "../GolfConstants";
import { FlagPosition, HoleData, Launch, Point } from "../GolfTypes";
import Ball, { BallState } from "./ball";
import Polygon from "./polygon";
import { manhattanDistance } from "./vector-utils";

export default class Stage {
  collisionObjects: Polygon[];
  players: [Ball, ...Ball[]];
  winners: Ball[] = [];
  replay: Launch[][] | undefined;

  constructor(data: HoleData) {
    this.collisionObjects = data.collisionObjects.map(
      (object) => new Polygon(object, data.startPos)
    );
    this.collisionObjects.push(
      new Polygon(
        {
          points: [
            { x: 0, y: 0 },
            { x: data.dimensions.x, y: 0 },
            {
              x: data.dimensions.x,
              y: data.dimensions.y,
            },
            { x: 0, y: data.dimensions.y },
          ],
          segments: [
            CollisionType.NORMAL,
            CollisionType.NORMAL,
            CollisionType.WATER,
            CollisionType.NORMAL,
          ],
        },
        data.startPos
      )
    );
    this.players = [new Ball({ ...data.startPos }, this.collisionObjects)];
  }

  getFlagPositions(): FlagPosition[] {
    return this.collisionObjects.flatMap((polygon) =>
      polygon.getFlagPositions()
    );
  }

  replayLaunches(replay: Launch[][]) {
    this.replay = replay.map((launches) => [...launches]);
    this.reset();
  }

  clearReplay() {
    this.replay = undefined;
    this.reset();
  }

  update() {
    if (this.replay) {
      for (const [i, launches] of this.replay.entries()) {
        if (
          launches.length &&
          (this.players[i].frame === launches[0].frame ||
            manhattanDistance(this.players[i].position, launches[0].position) <
              0.01)
        ) {
          const launch = launches.shift()!;
          this.launchBall(
            i,
            launch.angle,
            launch.power,
            launch.position,
            launch.frame
          );
        }
      }
    }
    for (const player of this.players) {
      if (player.state === BallState.SCORED) continue;
      if (player.update()) {
        this.winners.push(player);
      }
    }
    return this.winners;
  }

  reset() {
    for (const player of this.players) {
      player.reset();
    }
    this.winners = [];
  }

  getBallPositions() {
    return this.players.map((player) => player.position);
  }

  getScore(i?: number) {
    return scoreFromLaunches(this.players[i ?? 0].launchRecord);
  }

  getReplay() {
    return this.players.map((player) => player.launchRecord);
  }

  isPuttMode() {
    return (
      this.players[0].lastCollision?.collision.with[0].type ===
      CollisionType.GREEN
    );
  }

  launchBall(
    index: number,
    angle: number,
    power: number,
    position?: Point,
    frame?: number
  ) {
    this.players[index].launch(angle, power, position, frame);
  }
}

export function scoreFromLaunches(launches: Launch[]) {
  let strokes = 0;
  for (const launch of launches) {
    strokes++;
    if (launch.outOfBounds) strokes++;
  }
  return strokes;
}
