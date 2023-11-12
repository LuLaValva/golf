export const BALL_RADIUS = 4;

/**
 * Ordered by priority (if adjacent segments have different types, the lower one takes precendence)
 */
export enum CollisionType {
  NORMAL,
  SLIPPERY,
  BOUNCY,
  SAND,
  HOLE,
  GREEN,
  STICKY,
  WATER,
}

interface MaterialProperties {
  bounce: number;
  friction: number;
}

export const MATERIAL_PROPERTIES: {
  [key in CollisionType]: MaterialProperties;
} = {
  [CollisionType.NORMAL]: { bounce: -0.3, friction: 0.94 },
  [CollisionType.BOUNCY]: { bounce: -0.6, friction: 0.91 },
  [CollisionType.SLIPPERY]: { bounce: -0.2, friction: 0.98 },
  [CollisionType.STICKY]: { bounce: -0.1, friction: 0 },
  [CollisionType.SAND]: { bounce: -0.07, friction: 0.4 },
  [CollisionType.WATER]: { bounce: 0.5, friction: 0.5 },
  [CollisionType.GREEN]: { bounce: -0.2, friction: 0.96 },
  [CollisionType.HOLE]: { bounce: -0.1, friction: 0 },
};

export const COLLISION_TYPE_COLORS: { [key in CollisionType]: string } = {
  [CollisionType.NORMAL]: "var(--surface-type-normal)",
  [CollisionType.BOUNCY]: "var(--surface-type-bouncy)",
  [CollisionType.GREEN]: "var(--surface-type-green)",
  [CollisionType.HOLE]: "var(--surface-type-hole)",
  [CollisionType.STICKY]: "var(--surface-type-sticky)",
  [CollisionType.WATER]: "var(--surface-type-water)",
  [CollisionType.SLIPPERY]: "var(--surface-type-slippery)",
  [CollisionType.SAND]: "var(--surface-type-sand)",
};
