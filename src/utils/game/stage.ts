import { CollisionType } from "../GolfConstants";
import { FlagPosition, HoleData, Point } from "../GolfTypes";
import Ball, { BallState } from "./ball";
import Polygon from "./polygon";

export default class Stage {
  collisionObjects: Polygon[];
  players: [Ball, ...Ball[]];
  winners: Ball[] = [];

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

  update() {
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

  launchBall(index: number, angle: number, power: number, position?: Point) {
    this.players[index].launch(angle, power, position);
  }
}
