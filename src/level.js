// src/level.js
import { CONFIG } from './config.js?v=13';
import { getStageForLevel, generateGateChallenge } from './curriculum.js?v=13';

export class LevelManager {
  constructor() {
    this.mode = 'levels'; // 'arcade' | 'levels'
    this.level = 1;
    this.wave = 1;
    this.state = 'idle'; // idle, wave, boss, transition
    this.timer = 0;
    this.waveTimer = 0;
    this.bossActive = false;
    this.difficulty = 1;
    this.arcadeTime = 0;
    this.spawnTimer = 0;
    this.gateTimer = 5.5;
    this.milestoneIndex = 0;
    this.milestoneTimer = 4.0;
  }

  start(mode) {
    this.mode = mode;
    this.level = 1;
    this.wave = 1;
    this.state = 'wave';
    this.timer = 0;
    this.waveTimer = 0;
    this.bossActive = false;
    this.difficulty = 1;
    this.arcadeTime = 0;
    this.spawnTimer = 0.8;
    this.gateTimer = 5.5;
    this.milestoneIndex = 0;
    this.milestoneTimer = 4.5;
  }

  getCurrentStage() {
    if (this.mode === 'arcade') {
      const stageLvl = Math.floor(this.arcadeTime / 45) + 1;
      return getStageForLevel(stageLvl);
    }
    return getStageForLevel(this.level);
  }

  update(dt, onMilestone, gateActive = false) {
    this.milestoneTimer -= dt;
    if (this.milestoneTimer <= 0) {
      this.milestoneTimer = 15.0;
      const st = this.getCurrentStage();
      if (st.milestones && st.milestones.length) {
        const msg = st.milestones[this.milestoneIndex % st.milestones.length];
        this.milestoneIndex++;
        if (onMilestone) onMilestone(msg);
      }
    }

    if (this.mode === 'arcade') {
      this.arcadeTime += dt;
      this.level = Math.floor(this.arcadeTime / 45) + 1;
      this.difficulty = 1 + Math.min(3.0, this.arcadeTime / 180);
      return;
    }

    // En modo niveles, pausamos el reloj de oleada mientras el niño responde la tarjeta
    this.timer += dt;
    if (this.state === 'wave' && !gateActive) {
      this.waveTimer += dt;
      const waveDuration = 22 + Math.min(8, (this.level - 1) * 2);
      if (this.waveTimer > waveDuration) {
        this.state = 'boss';
        this.bossActive = true;
        this.waveTimer = 0;
      }
    }
  }

  getSpawns(dt, gateAlreadyActive = false) {
    const out = [];

    // Si hay una Tarjeta de Pregunta o Tarjetas de Opciones activas en pantalla,
    // despejamos la ruta (no aparecen enemigos nuevos) para que el jugador lea y responda tranquilo.
    if (gateAlreadyActive) {
      return out;
    }

    if (!this.bossActive) {
      this.gateTimer -= dt;
      if (this.gateTimer <= 0) {
        this.gateTimer = 11.5;
        const challenge = generateGateChallenge(this.level, this.mode, this.arcadeTime);
        out.push({ kind: 'gate', challenge });
        this.spawnTimer = 2.0;
        return out;
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return out;

    const stage = this.getCurrentStage();
    const themeObstacle = stage.obstacleTheme || 'asteroid';

    if (this.mode === 'arcade') {
      this.spawnTimer = Math.max(0.32, 0.98 - (this.difficulty - 1) * 0.3);
      const r = Math.random();
      if (r < 0.46) {
        out.push({
          kind: 'enemy',
          type: this.pickEnemyArcade(),
          x: (Math.random() * 2 - 1) * CONFIG.boundsX * 0.82,
          y: (Math.random() * 2 - 1) * CONFIG.boundsY * 0.7,
        });
      } else if (r < 0.76) {
        const obsType = Math.random() < 0.6 ? themeObstacle : 'asteroid';
        out.push({
          kind: 'obstacle',
          type: obsType,
          x: (Math.random() * 2 - 1) * CONFIG.boundsX * 0.85,
          y: (Math.random() * 2 - 1) * CONFIG.boundsY * 0.75,
        });
      } else if (r < 0.92) {
        out.push({
          kind: 'powerup',
          type: this.pickPowerup(),
          x: (Math.random() * 2 - 1) * CONFIG.boundsX * 0.65,
          y: (Math.random() * 2 - 1) * CONFIG.boundsY * 0.55,
        });
      }
    } else {
      // Modo Niveles: amigable para niños en nivel 1 y progresivamente más retador
      this.spawnTimer = Math.max(0.35, 1.05 - (this.level - 1) * 0.1 - (this.wave - 1) * 0.06);
      if (this.state === 'wave') {
        const wave = this.wave;
        const lvl = this.level;
        if (wave === 1) {
          if (Math.random() < 0.58)
            out.push({ kind: 'enemy', type: 'fighter', x: (Math.random() * 2 - 1) * 5.8, y: (Math.random() * 2 - 1) * 3.0 });
          if (lvl >= 2 && Math.random() < 0.28)
            out.push({ kind: 'enemy', type: 'kamikaze', x: (Math.random() * 2 - 1) * 5.5, y: (Math.random() * 2 - 1) * 2.8 });
          if (Math.random() < 0.42)
            out.push({ kind: 'obstacle', type: themeObstacle, x: (Math.random() * 2 - 1) * 6.2, y: (Math.random() * 2 - 1) * 3.0 });
        } else {
          if (Math.random() < 0.55)
            out.push({ kind: 'enemy', type: 'fighter', x: (Math.random() * 2 - 1) * 5.8, y: (Math.random() * 2 - 1) * 3.0 });
          if (Math.random() < 0.35 + lvl * 0.04)
            out.push({ kind: 'enemy', type: 'bomber', x: (Math.random() * 2 - 1) * 5.0, y: (Math.random() * 2 - 1) * 2.5 });
          if (lvl >= 2 && Math.random() < 0.32)
            out.push({ kind: 'enemy', type: 'kamikaze', x: (Math.random() * 2 - 1) * 5.5, y: (Math.random() * 2 - 1) * 2.8 });
          if (Math.random() < 0.38)
            out.push({ kind: 'obstacle', type: themeObstacle, x: (Math.random() * 2 - 1) * 6.2, y: (Math.random() * 2 - 1) * 3.0 });
          if (Math.random() < 0.2)
            out.push({ kind: 'powerup', type: this.pickPowerup(), x: (Math.random() * 2 - 1) * 4.5, y: (Math.random() * 2 - 1) * 2.2 });
        }
      }
    }
    return out;
  }

  pickEnemyArcade() {
    const r = Math.random();
    const d = this.difficulty;
    if (r < 0.5) return 'fighter';
    if (r < 0.72 + d * 0.02) return 'kamikaze';
    return 'bomber';
  }

  pickPowerup() {
    const r = Math.random();
    if (r < 0.3) return 'boost';
    if (r < 0.55) return 'shield';
    if (r < 0.75) return 'health';
    if (r < 0.9) return 'double';
    return 'triple';
  }

  advanceLevel() {
    this.level += 1;
    this.wave = 1;
    this.state = 'wave';
    this.timer = 0;
    this.waveTimer = 0;
    this.bossActive = false;
    this.difficulty = 1 + (this.level - 1) * 0.32;
    this.gateTimer = 5.0;
    this.milestoneIndex = 0;
    this.milestoneTimer = 3.0;
  }

  advanceWave() {
    this.wave += 1;
    this.waveTimer = 0;
  }

  setBossDefeated() {
    this.bossActive = false;
    if (this.mode === 'levels') {
      if (this.wave < 2) {
        this.advanceWave();
        this.state = 'wave';
      } else {
        this.state = 'transition';
      }
    }
  }
}
