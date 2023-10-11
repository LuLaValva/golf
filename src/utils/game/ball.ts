import { Launch, Point, Vector } from "../GolfTypes";
import Polygon, { Collision } from "./polygon";
import { add, scale } from "./vector-utils";

enum BallState {
  NORMAL,
  STUCK,
  SINKING,
  SCORED,
}

export default class Ball {
  spawnPoint: Point;
  collisionObjects: Polygon[];

  position: Point;
  velocity: Vector;

  launchRecord: Launch[] = [];
  state: BallState = BallState.NORMAL;
  stateTimer: number = 0;

  constructor(spawnPoint: Point, collisionObjects: Polygon[]) {
    this.position = this.spawnPoint = spawnPoint;
    this.velocity = { x: 0, y: 0 };
    this.collisionObjects = collisionObjects;
  }

  /**
   * @param angle _radians_
   */
  launch(angle: number, power: number, position = this.position) {
    this.position = position;
    this.velocity = {
      x: this.velocity.x + Math.cos(angle) * power,
      y: this.velocity.y + Math.sin(angle) * power,
    };
    this.launchRecord.push({ position, velocity: this.velocity });
    this.updateState(BallState.NORMAL);
  }

  updateState(newState: BallState) {
    this.state = newState;
    this.stateTimer = 0;
  }

  update() {
    this.stateTimer++;
    switch (this.state) {
      case BallState.NORMAL:
        this.applyPhysics();
        break;
      case BallState.STUCK:
        // do nothing
        break;
      case BallState.SINKING:
        if (this.stateTimer > 60) {
          this.respawn();
        }
        this.applyPhysics();
        break;
      case BallState.SCORED:
        return true;
    }
    return false;
  }

  findNearestCollision(previousCollision?: Collision) {
    let nearestCollision: Collision | null = null;
    for (const polygon of this.collisionObjects) {
      // TODO(optimization): only check polygons that are close enough
      const collision = polygon.findNearestCollision(
        this.position,
        this.velocity,
        previousCollision
      );
      if (
        collision &&
        (!nearestCollision ||
          collision.proportion < nearestCollision.proportion)
      ) {
        nearestCollision = collision;
      }
    }
    return nearestCollision;
  }

  applyPhysics() {
    this.velocity.y += 0.3;
    let traveledProportion = 0;
    // const collisions = [];
    for (
      let collision = this.findNearestCollision(), max = 99999;
      collision && max > 0;
      collision = this.findNearestCollision(collision), max--
    ) {
      this.position = { ...collision.point };
      const tangent = scale(collision.tangent, 0.96);
      const normal = scale(collision.normal, -0.3);
      this.velocity = add(tangent, normal);
      // collisions.push({ ...collision, velocity: { ...this.velocity } });
      traveledProportion = collision.proportion;
    }
    // if (collisions.length) console.log(collisions);
    this.position.x += this.velocity.x * (1 - traveledProportion);
    this.position.y += this.velocity.y * (1 - traveledProportion);
  }

  respawn() {
    const lastLaunch = this.launchRecord[this.launchRecord.length - 1];
    if (lastLaunch) {
      this.position = { ...lastLaunch.position };
      lastLaunch.outOfBounds = true;
    } else {
      this.position = { ...this.spawnPoint };
    }
    this.velocity = { x: 0, y: 0 };
    this.updateState(BallState.STUCK);
  }
}