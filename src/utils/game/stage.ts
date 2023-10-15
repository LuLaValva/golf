import { BALL_RADIUS, CollisionType } from "../GolfConstants";
import { HoleData, Point } from "../GolfTypes";
import Ball from "./ball";
import Polygon from "./polygon";

export default class Stage {
  collisionObjects: Polygon[];
  players: [Ball, ...Ball[]];

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
            CollisionType.NORMAL,
            CollisionType.NORMAL,
          ],
        },
        data.startPos
      )
    );
    this.players = [new Ball({ ...data.startPos }, this.collisionObjects)];
  }

  update() {
    for (const player of this.players) {
      player.update();
    }
  }

  getBallPositions() {
    return this.players.map((player) => player.position);
  }

  launchBall(index: number, angle: number, power: number, position?: Point) {
    this.players[index].launch(angle, power, position);
  }
}
