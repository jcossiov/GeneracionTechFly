// src/config.js
export const DEFAULT_BINDINGS = {
  moveUp: ['KeyW', 'ArrowUp'],
  moveDown: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  fire: ['Space'],
  boost: ['ShiftLeft', 'ShiftRight'],
  pause: ['Escape', 'KeyP'],
};
export const CONFIG = {
  // World
  spawnZ: 70,
  despawnZ: -12,
  playerZ: 0,
  boundsX: 7.5,
  boundsY: 4.5,
  baseSpeed: 18,          // scroll speed of world (units/s)
  maxSpeed: 40,
  playerSpeed: 13,
  boostMult: 1.7,
  bulletSpeed: 55,
  enemyBulletSpeed: 22,
  fireRate: 0.16,         // seconds between shots (level 1)
  // Difficulty
  arcadeRamp: 0.0008,     // per second
  // Health
  playerMaxHp: 100,
  playerMaxShield: 100,
  // Scoring
  scorePerSecond: 5,
  scorePerKill: 50,
  scorePerObstacle: 10,
  // Visual
  fogNear: 30,
  fogFar: 90,
  // Audio
  masterMusic: 0.35,
  masterSfx: 0.6,
};

export const ENEMY_TYPES = {
  FIGHTER: 'fighter',
  BOMBER: 'bomber',
  KAMIKAZE: 'kamikaze',
  BLOCKER: 'blocker',
};

export const POWERUP_TYPES = {
  SHIELD: 'shield',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  HEALTH: 'health',
  BOOST: 'boost',
};
