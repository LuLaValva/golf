import { CollisionType } from "../GolfConstants";
import { Launch, Point, Vector } from "../GolfTypes";
import Polygon, {
  Collision,
  compareCollisions,
  velocityFromCollision,
} from "./polygon";
import { scale } from "./vector-utils";

export enum BallState {
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

  lastCollision?: {
    collision: Collision;
    numUpdatesSince: number;
  };

  constructor(spawnPoint: Point, collisionObjects: Polygon[]) {
    this.spawnPoint = { ...spawnPoint };
    this.position = { ...this.spawnPoint };
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
    this.launchRecord.push({
      position: { ...this.position },
      velocity: { ...this.velocity },
    });
    this.updateState(BallState.NORMAL);
  }

  updateState(newState: BallState) {
    this.state = newState;
    this.stateTimer = 0;
  }

  update() {
    this.stateTimer++;
    if (this.lastCollision) this.lastCollision.numUpdatesSince++;
    switch (this.state) {
      case BallState.NORMAL:
        this.applyPhysics();
        break;
      case BallState.STUCK:
        // do nothing
        break;
      case BallState.SINKING:
        if (this.stateTimer > 50) {
          this.respawn();
        }
        this.velocity = scale(this.velocity, 0.8);
        this.applyPhysics(0.05);
        break;
      case BallState.SCORED:
        break;
    }
    return this.state === BallState.SCORED;
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
      nearestCollision = compareCollisions(nearestCollision, collision);
    }
    return nearestCollision;
  }

  applyPhysics(gravity = 0.2) {
    this.velocity.y += gravity;
    let traveledProportion = 0;
    // const collisions = [];
    for (
      let collision = this.findNearestCollision();
      collision;
      collision = this.findNearestCollision(collision)
    ) {
      if (
        collision.proportion - traveledProportion < 0.00001 &&
        this.lastCollision &&
        this.lastCollision.numUpdatesSince <= 1
      ) {
        // This is a hack to prevent the ball from phasing through tight corners
        this.velocity = { x: 0, y: 0 };
        this.lastCollision = {
          collision,
          numUpdatesSince: 0,
        };
        break;
      }
      this.lastCollision = {
        collision,
        numUpdatesSince: 0,
      };

      this.position = { ...collision.point };
      if (collision.with[0].type === CollisionType.HOLE) {
        this.updateState(BallState.SCORED);
        this.velocity = { x: 0, y: 0 };
        break;
      }
      if (
        this.stateTimer > 1 &&
        this.state === BallState.NORMAL &&
        collision.with[0].type === CollisionType.STICKY
      ) {
        this.updateState(BallState.STUCK);
        this.velocity = { x: 0, y: 0 };
        break;
      }
      this.velocity = velocityFromCollision(collision, this.velocity);
      // collisions.push({ ...collision, velocity: { ...this.velocity } });
      traveledProportion = collision.proportion;
      if (collision.with[0].type === CollisionType.WATER) {
        this.updateState(BallState.SINKING);
        break;
      }
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

  reset() {
    this.launchRecord = [];
    this.respawn();
    this.updateState(BallState.NORMAL);
  }
}
