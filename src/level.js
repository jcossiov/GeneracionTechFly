// src/level.js
import { CONFIG, ENEMY_TYPES } from './config.js?v=11';

export class LevelManager {
  constructor() {
    this.mode = 'arcade'; // 'arcade' | 'levels'
    this.level = 1;
    this.wave = 1;
    this.state = 'idle'; // idle, wave, boss, transition
    this.timer = 0;
    this.waveTimer = 0;
    this.bossActive = false;
    this.difficulty = 1;
    this.arcadeTime = 0;
    this.enemiesToSpawn = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
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
    this.spawnQueue = [];
    this.spawnTimer = 0.5;
  }

  update(dt) {
    if (this.mode === 'arcade') {
      this.arcadeTime += dt;
      this.difficulty = 1 + Math.min(3, this.arcadeTime / 300); // +10% cada 30s hasta +300%
      // spawn logic handled by game via spawnTimer
      return;
    }
    // levels mode
    this.timer += dt;
    if (this.state === 'wave') {
      this.waveTimer += dt;
      if (this.waveTimer > 18) {
        // end wave -> boss
        this.state = 'boss';
        this.bossActive = true;
        this.waveTimer = 0;
      }
    }
  }

  // Returns spawn instructions for this frame: array of {type:'enemy'|'obstacle'|'powerup'|'boss', ...}
  getSpawns(dt, width) {
    const out = [];
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return out;

    if (this.mode === 'arcade') {
      this.spawnTimer = Math.max(0.25, 1.0 - (this.difficulty-1)*0.5);
      const r = Math.random();
      if (r < 0.45) {
        out.push({ kind:'enemy', type: this.pickEnemyArcade(), x: (Math.random()*2-1)*CONFIG.boundsX*0.85, y: (Math.random()*2-1)*CONFIG.boundsY*0.7 });
      } else if (r < 0.75) {
        out.push({ kind:'obstacle', type: Math.random()<0.7?'asteroid':'debris', x: (Math.random()*2-1)*CONFIG.boundsX*0.9, y: (Math.random()*2-1)*CONFIG.boundsY*0.8 });
      } else if (r < 0.82) {
        out.push({ kind:'obstacle', type:'pillar', x: (Math.random()*2-1)*CONFIG.boundsX*0.6, y: 0 });
      } else if (r < 0.9) {
        out.push({ kind:'powerup', type: this.pickPowerup(), x: (Math.random()*2-1)*CONFIG.boundsX*0.6, y: (Math.random()*2-1)*CONFIG.boundsY*0.5 });
      }
      // occasionally multiple
      if (Math.random() < 0.25 + this.difficulty*0.05) {
        out.push({ kind:'enemy', type:'fighter', x: (Math.random()*2-1)*CONFIG.boundsX*0.85, y: (Math.random()*2-1)*CONFIG.boundsY*0.7 });
      }
    } else {
      // levels mode
      this.spawnTimer = 0.9;
      if (this.state === 'wave') {
        const wave = this.wave;
        if (wave === 1) {
          if (Math.random() < 0.6) out.push({ kind:'enemy', type:'fighter', x:(Math.random()*2-1)*5, y:(Math.random()*2-1)*3 });
          if (Math.random() < 0.3) out.push({ kind:'obstacle', type:'asteroid', x:(Math.random()*2-1)*6, y:(Math.random()*2-1)*3 });
        } else if (wave === 2) {
          if (Math.random() < 0.5) out.push({ kind:'enemy', type:'fighter', x:(Math.random()*2-1)*5, y:(Math.random()*2-1)*3 });
          if (Math.random() < 0.4) out.push({ kind:'enemy', type:'bomber', x:(Math.random()*2-1)*4, y:(Math.random()*2-1)*2 });
          if (Math.random() < 0.35) out.push({ kind:'obstacle', type:'debris', x:(Math.random()*2-1)*6, y:(Math.random()*2-1)*3 });
        } else {
          if (Math.random() < 0.5) out.push({ kind:'enemy', type:'fighter', x:(Math.random()*2-1)*5, y:(Math.random()*2-1)*3 });
          if (Math.random() < 0.4) out.push({ kind:'enemy', type:'kamikaze', x:(Math.random()*2-1)*5, y:(Math.random()*2-1)*3 });
          if (Math.random() < 0.3) out.push({ kind:'enemy', type:'bomber', x:(Math.random()*2-1)*4, y:(Math.random()*2-1)*2 });
          if (Math.random() < 0.3) out.push({ kind:'obstacle', type:'asteroid', x:(Math.random()*2-1)*6, y:(Math.random()*2-1)*3 });
          if (Math.random() < 0.15) out.push({ kind:'powerup', type:this.pickPowerup(), x:(Math.random()*2-1)*4, y:(Math.random()*2-1)*2 });
        }
      }
      // boss spawn handled by game when state becomes boss
    }
    return out;
  }

  pickEnemyArcade() {
    const r = Math.random();
    const d = this.difficulty;
    if (r < 0.5) return 'fighter';
    if (r < 0.7 + d*0.02) return 'kamikaze';
    if (r < 0.85) return 'bomber';
    return 'fighter';
  }

  pickPowerup() {
    const r = Math.random();
    if (r < 0.35) return 'boost';
    if (r < 0.55) return 'shield';
    if (r < 0.75) return 'health';
    if (r < 0.90) return 'double';
    return 'triple';
  }

  advanceLevel() {
    this.level += 1;
    this.wave = 1;
    this.state = 'wave';
    this.timer = 0;
    this.waveTimer = 0;
    this.bossActive = false;
    this.difficulty = 1 + (this.level-1)*0.3;
  }

  advanceWave() {
    this.wave += 1;
    this.waveTimer = 0;
  }

  setBossDefeated() {
    this.bossActive = false;
    if (this.mode === 'levels') {
      if (this.wave < 3) {
        this.advanceWave();
        this.state = 'wave';
      } else {
        // level complete
        this.state = 'transition';
      }
    }
  }
}
