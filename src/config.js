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
  spawnZ: 80,
  despawnZ: -14,
  playerZ: 0,
  boundsX: 7.8,
  boundsY: 4.5,
  baseSpeed: 19,          // scroll speed of world (units/s)
  maxSpeed: 42,
  playerSpeed: 14.5,
  boostMult: 1.7,
  bulletSpeed: 65,
  enemyBulletSpeed: 22,
  fireRate: 0.14,         // seconds between shots (level 1)
  // Gate / Question Card timing (slow & child-friendly)
  questionCardSpeed: 10.5, // ~7.5 seconds to read and fly into the question card
  optionsCardSpeed: 8.5,   // ~9.5 seconds to read the options and steer into the right card
  // Difficulty
  arcadeRamp: 0.001,
  // Health
  playerMaxHp: 100,
  playerMaxShield: 100,
  // Scoring
  scorePerSecond: 6,
  scorePerKill: 60,
  scorePerObstacle: 15,
  scorePerGate: 200,
  // Visual
  fogNear: 38,
  fogFar: 115,
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
