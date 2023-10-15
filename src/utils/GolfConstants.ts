export const BALL_RADIUS = 4;

export enum CollisionType {
  NORMAL,
  BOUNCY,
  SLIPPERY,
  STICKY,
  SAND,
  WATER,
  GREEN,
}

interface MaterialProperties {
  bounce: number;
  friction: number;
}

export const MATERIAL_PROPERTIES: {
  [key in CollisionType]: MaterialProperties;
} = {
  [CollisionType.NORMAL]: { bounce: -0.3, friction: 0.96 },
  [CollisionType.BOUNCY]: { bounce: -0.6, friction: 0.91 },
  [CollisionType.SLIPPERY]: { bounce: -0.2, friction: 0.98 },
  [CollisionType.STICKY]: { bounce: -0.001, friction: 0 },
  [CollisionType.SAND]: { bounce: -0.07, friction: 0.4 },
  [CollisionType.WATER]: { bounce: 0.1, friction: 0.5 },
  [CollisionType.GREEN]: { bounce: -0.2, friction: 0.96 },
};
