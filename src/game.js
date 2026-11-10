// src/game.js
import * as THREE from 'three';
import { CONFIG, DEFAULT_BINDINGS } from './config.js?v=13';
import {
  Player,
  EnemyPool,
  BulletPool,
  ObstaclePool,
  PowerUpPool,
  GateManager,
  ParticleSystem,
  Boss,
} from './entities.js?v=13';
import { LevelManager } from './level.js?v=13';
import { getStageForLevel } from './curriculum.js?v=13';
import { AudioEngine } from './audio.js?v=13';
import { InputManager } from './controls.js?v=13';
import {
  saveScore,
  loadSettings,
  loadBindings,
  loadPlayerName,
} from './storage.js?v=13';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x071326);
    this.scene.fog = new THREE.Fog(0x0b1d3a, CONFIG.fogNear, CONFIG.fogFar);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 220);
    this.camera.position.set(0, 4.6, -10.5);
    this.camera.lookAt(0, 0, 10);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this._currentDpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this._currentDpr);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Iluminación PBR realista
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.9);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(8, 16, -10);
    this.scene.add(dir);

    this.jetLight = new THREE.PointLight(0x38bdf8, 1.2, 38);
    this.jetLight.position.set(0, 2, 2);
    this.scene.add(this.jetLight);

    // Estrellas + Cyber-Grid en movimiento
    this.stars = this.createStars();
    this.scene.add(this.stars);

    this.cyberGrid = this.createCyberGrid();
    this.scene.add(this.cyberGrid);

    // Pools pre-alocados (Zero-Lag)
    this.playerBullets = new BulletPool(this.scene, 48, true);
    this.enemyBullets = new BulletPool(this.scene, 75, false);
    this.enemies = new EnemyPool(this.scene, 26);
    this.obstacles = new ObstaclePool(this.scene, 30);
    this.powerups = new PowerUpPool(this.scene, 10);
    this.gateManager = new GateManager(this.scene);
    this.particles = new ParticleSystem(this.scene, 180);
    this.boss = new Boss(this.scene);

    this.player = new Player(this.scene);

    this.levelManager = new LevelManager();
    this.audio = new AudioEngine();
    this.settings = Object.assign(
      {
        musicVol: 0.35,
        sfxVol: 0.6,
        mouseSens: 1.5,
        showFps: false,
        vibrate: true,
      },
      loadSettings()
    );
    this.player.settings = this.settings;

    this.audio.setMusicVolume(this.settings.musicVol);
    this.audio.setSfxVolume(this.settings.sfxVol);
    const loadedBindings = loadBindings();
    this.bindings = loadedBindings
      ? Object.assign(JSON.parse(JSON.stringify(DEFAULT_BINDINGS)), loadedBindings)
      : JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.playerName = loadPlayerName() || 'Piloto Tech';
    this.input = new InputManager(canvas, this.settings, this.bindings);

    this.state = 'menu';
    this.score = 0;
    this.time = 0;
    this.techStreak = 0;
    this.worldSpeed = CONFIG.baseSpeed;
    this.fps = 60;
    this._fpsAcc = 0;
    this._fpsFrames = 0;
    this._bossSpawned = false;
    this._levelCompletePending = false;
    this._activeStageLevel = 0;

    this.ui = null;

    // Pre-compilación de shaders para evitar tirones iniciales
    this.updateCamera(0.016);
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  setUI(ui) {
    this.ui = ui;
  }

  createStars() {
    const geo = new THREE.BufferGeometry();
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 70;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 45;
      pos[i * 3 + 2] = Math.random() * 130;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  }

  createCyberGrid() {
    const group = new THREE.Group();
    const grid = new THREE.GridHelper(160, 48, 0x00b4d8, 0x0077b6);
    grid.position.set(0, -5.6, 40);
    grid.material.transparent = true;
    grid.material.opacity = 0.32;
    this.gridHelper = grid;
    group.add(grid);
    return group;
  }

  applyStageTheme(stage) {
    if (!stage || this._activeStageLevel === stage.level) return;
    this._activeStageLevel = stage.level;
    this.scene.background.setHex(stage.skyColor);
    this.scene.fog.color.setHex(stage.fogColor);
    if (this.gridHelper && this.gridHelper.material) {
      this.gridHelper.material.color.setHex(stage.gridColor);
    }
  }

  // Vista Panorámica adaptativa para Tablets en Horizontal y Vertical
  updateCamera(dt) {
    const isPortrait = window.innerHeight > window.innerWidth;
    const p = this.player.group.position;
    
    // En modo vertical (Portrait / Tablets verticales), alejamos la cámara un poco y subimos el FOV para que no se recorte nada del mundo
    const targetY = isPortrait ? (5.8 + p.y * 0.22) : (4.6 + p.y * 0.28);
    const targetZ = isPortrait ? -14.2 : -10.5;
    const targetX = p.x * 0.38;

    this.camera.position.x += (targetX - this.camera.position.x) * Math.min(1, dt * 10);
    this.camera.position.y += (targetY - this.camera.position.y) * Math.min(1, dt * 10);
    this.camera.position.z += (targetZ - this.camera.position.z) * Math.min(1, dt * 10);
    this.camera.lookAt(p.x * 0.35, p.y * 0.22, 10);

    this.jetLight.position.set(p.x, p.y + 2.0, p.z + 1.0);
  }

  onResize() {
    const isPortrait = window.innerHeight > window.innerWidth;
    // Si la tablet o pantalla está en vertical, aumentamos el FOV a 74° para garantizar un campo de visión ancho
    this.camera.fov = isPortrait ? 74 : 60;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startMode(mode, startLevel = 1) {
    this.resetRun();
    this.levelManager.start(mode, startLevel);
    const stage = this.levelManager.getCurrentStage();
    this.applyStageTheme(stage);
    this.state = 'playing';
    setTimeout(() => {
      this.audio.ensure();
      this.audio.resumeMusic();
    }, 0);
    if (this.ui) {
      this.ui.showHUD(true);
    }
    if (mode === 'levels') {
      this.showLevelSplash(this.levelManager.level);
    } else if (this.ui) {
      this.ui.toast(`🚀 ${stage.lifeStage} • ${stage.moduleName}`);
    }
  }

  resetRun() {
    this.player.reset();
    this.score = 0;
    this.time = 0;
    this.techStreak = 0;
    this.worldSpeed = CONFIG.baseSpeed;
    this._activeStageLevel = 0;

    for (const p of this.playerBullets.pool) p.deactivate();
    for (const p of this.enemyBullets.pool) p.deactivate();
    for (const e of this.enemies.pool) e.deactivate();
    for (const o of this.obstacles.pool) o.deactivate();
    for (const p of this.powerups.pool) p.deactivate();
    this.gateManager.deactivate();
    this.boss.deactivate();
    this._bossSpawned = false;
    this._levelCompletePending = false;
    if (this.ui) this.ui.hideQuestionBanner();
  }

  showLevelSplash(lvl) {
    this.state = 'levelTransition';
    const stage = getStageForLevel(lvl);
    this.applyStageTheme(stage);
    if (this.ui) {
      this.ui.showLevelSplash(lvl, stage, () => {
        this.state = 'playing';
      });
    }
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio.stopMusic();
    if (this.ui) this.ui.showPause(true);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.audio.resumeMusic();
    if (this.ui) this.ui.showPause(false);
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.player.alive = false;
    this.audio.stopMusic();
    this.audio.explode(true);
    const mode = this.levelManager.mode;
    saveScore({
      name: this.playerName,
      score: Math.floor(this.score),
      mode,
      level: this.levelManager.level,
      time: Math.floor(this.time),
      date: Date.now(),
    });
    if (this.ui) {
      this.ui.hideQuestionBanner();
      this.ui.showGameOver(Math.floor(this.score), this.levelManager.level, this.time);
    }
  }

  levelComplete() {
    if (this._levelCompletePending === false && this.levelManager.state !== 'transition') return;
    this.audio.levelup();
    const completedLvl = this.levelManager.level;
    this.levelManager.advanceLevel();
    const nextStage = this.levelManager.getCurrentStage();
    this.applyStageTheme(nextStage);

    for (const e of this.enemies.pool) e.deactivate();
    for (const o of this.obstacles.pool) o.deactivate();
    for (const b of this.enemyBullets.pool) b.deactivate();
    this.gateManager.deactivate();
    this.boss.deactivate();
    this._bossSpawned = false;
    this._levelCompletePending = false;
    if (this.ui) {
      this.ui.hideQuestionBanner();
      this.ui.toast(`🎉 ¡Nivel ${completedLvl} superado! Avanzando en la Ruta Gen Tech`);
    }
    this.showLevelSplash(this.levelManager.level);
  }

  update(dt) {
    if (dt > 0.1) dt = 0.1;

    this._fpsAcc += dt;
    this._fpsFrames++;
    if (this._fpsAcc >= 0.5) {
      this.fps = this._fpsFrames / this._fpsAcc;
      this._fpsAcc = 0;
      this._fpsFrames = 0;
      if (this.fps < 45 && this._currentDpr > 1.0) {
        this._currentDpr = Math.max(1.0, this._currentDpr - 0.25);
        this.renderer.setPixelRatio(this._currentDpr);
      }
    }

    const input = this.input.poll();
    input.mouseMoveX = this.input.mouseMoveX;
    input.mouseMoveY = this.input.mouseMoveY;
    input.settings = this.settings;

    if (this.input.consumePaused()) {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }

    if (this.state === 'levelTransition' || this.state !== 'playing') {
      this.render();
      return;
    }

    this.time += dt;

    const onMilestone = msg => {
      if (this.ui && !this.gateManager.active && !this.boss.active) {
        this.ui.toast(msg);
      }
    };

    this.levelManager.update(dt, onMilestone, this.gateManager.active);
    const currentStage = this.levelManager.getCurrentStage();
    this.applyStageTheme(currentStage);

    if (this.levelManager.mode === 'arcade') {
      this.worldSpeed = Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + this.levelManager.arcadeTime * 0.06);
    } else {
      this.worldSpeed = Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + (this.levelManager.level - 1) * 2.2);
      if (this.levelManager.state === 'boss' && !this._bossSpawned) {
        this._bossSpawned = true;
        this.gateManager.deactivate();
        if (this.ui) {
          this.ui.hideQuestionBanner();
          this.ui.toast(`⚠️ ¡JEFE DEL NIVEL: ${currentStage.bossName}!`);
        }
        this.boss.spawn(CONFIG.spawnZ, this.levelManager.difficulty, currentStage.bossName);
        this.audio.boss();
      }
      if (this.levelManager.state === 'transition' && !this._levelCompletePending) {
        this._levelCompletePending = true;
        this.levelComplete();
      }
    }

    const isBoosting = input.boost || this.player.boostTimer > 0;
    const effectiveWorldSpeed = this.worldSpeed * (isBoosting ? 1.3 : 1.0);

    // Actualizar avión y vista panorámica
    this.player.update(dt, input);
    if (!this.player.alive) {
      this.gameOver();
      return;
    }
    this.updateCamera(dt);

    // Disparo del jugador
    if (input.fire && this.player.canFire()) {
      this.firePlayer();
      this.player.onFire();
      this.audio.shoot(this.player.weapon);
    }

    // Spawns
    const spawns = this.levelManager.getSpawns(dt, this.gateManager.active);
    for (const s of spawns) {
      if (s.kind === 'gate') {
        this.gateManager.spawn(CONFIG.spawnZ, s.challenge);
        this.audio.gateSpawn();
        if (this.ui) {
          this.ui.showQuestionBanner(s.challenge, 'question_card');
        }
      } else if (s.kind === 'enemy') {
        const e = this.enemies.get();
        e.spawn(s.x, s.y, CONFIG.spawnZ, s.type, this.levelManager.difficulty);
      } else if (s.kind === 'obstacle') {
        const o = this.obstacles.get();
        o.spawn(s.x, s.y, CONFIG.spawnZ, s.type);
      } else if (s.kind === 'powerup') {
        const p = this.powerups.get();
        p.spawn(s.x, s.y, CONFIG.spawnZ, s.type);
      }
    }

    const playerPos = this.player.group.position;

    // Actualizar el sistema de 2 pasos: 1) Tarjeta de Pregunta -> 2) Tarjetas de Opciones
    if (this.gateManager.active) {
      this.gateManager.update(
        dt,
        playerPos,
        // Callback Paso 1: El jugador pasó por la Tarjeta de Pregunta y activó las opciones
        challenge => {
          this.audio.powerup();
          this.particles.burst(playerPos.clone().add(new THREE.Vector3(0, 0, 1.5)), 0xfbbf24, 20, 7);
          // Limpiar balas enemigas y enemigos cercanos para que el niño elija la respuesta con total tranquilidad
          for (const b of this.enemyBullets.pool) b.deactivate();
          for (const e of this.enemies.pool) e.deactivate();
          if (this.ui) {
            this.ui.showQuestionBanner(challenge, 'option_cards');
            this.ui.toast('🃏 ¡Opciones desplegadas al frente! Vuela hacia la respuesta correcta');
          }
        },
        // Callback Paso 2: El jugador eligió una Tarjeta de Opción
        (isCorrect, challenge, laneX) => {
          if (this.ui) this.ui.hideQuestionBanner();
          const burstPos = new THREE.Vector3(laneX, playerPos.y, CONFIG.playerZ + 1);
          if (isCorrect) {
            this.techStreak += 1;
            this.score += CONFIG.scorePerGate * (1 + this.techStreak * 0.15);
            this.applyGateReward(challenge.rewardType);
            this.audio.gateSuccess();
            this.particles.burst(burstPos, 0x10b981, 26, 8);
            if (this.ui) {
              this.ui.toast(`✅ ${challenge.rewardText} • ${challenge.rewardLabel}`);
            }
          } else {
            this.techStreak = 0;
            this.audio.gateFail();
            this.particles.burst(burstPos, 0xff2a55, 18, 6);
            this.player.takeDamage(10);
            if (this.ui) {
              this.ui.toast(`❌ La respuesta era: ${challenge.correctText} — ¡Sigue adelante!`);
            }
            if (this.player.hp <= 0) {
              this.gameOver();
              return;
            }
          }
        },
        // Callback si dejó pasar la tarjeta sin entrar
        () => {
          if (this.ui) this.ui.hideQuestionBanner();
        }
      );
      if (!this.gateManager.active && this.ui) {
        this.ui.hideQuestionBanner();
      }
    }

    // Actualizar enemigos y sus disparos
    this.enemies.update(dt, playerPos);
    const enemyBulletSpd = CONFIG.enemyBulletSpeed * (1 + (this.levelManager.level - 1) * 0.07);
    for (const e of this.enemies.active()) {
      if (e.canFire() && e.group.position.z < CONFIG.spawnZ - 6 && e.group.position.z > 6) {
        const dir = new THREE.Vector3().subVectors(playerPos, e.group.position).normalize();
        const b = this.enemyBullets.get();
        b.spawn(e.group.position.clone().add(new THREE.Vector3(0, 0, -0.6)), dir, enemyBulletSpd);
        b.damage = 11 + Math.min(10, (this.levelManager.level - 1) * 2);
        e.onFire();
      }
    }

    // Actualizar Jefe Evolutivo
    if (this.boss.active) {
      this.boss.update(dt, playerPos, effectiveWorldSpeed);
      if (this.boss.justChangedPhase) {
        this.audio.bossOverclock();
        if (this.ui) {
          const msg =
            this.boss.enragePhase === 2
              ? '⚡ ¡EL JEFE INCREMENTÓ SU VELOCIDAD Y PODER (OVERCLOCK I)!'
              : '🔥 ¡ALERTA MÁXIMA: EL JEFE ENTRÓ EN HIPER-VELOCIDAD Y FURIA TOTAL!';
          this.ui.toast(msg);
        }
      }
      if (this.boss.canFire()) {
        this.fireBoss(playerPos, enemyBulletSpd);
        this.boss.onFire();
      }
    }

    this.playerBullets.update(dt);
    this.enemyBullets.update(dt);
    this.obstacles.update(dt, effectiveWorldSpeed);
    this.powerups.update(dt, effectiveWorldSpeed);
    this.particles.update(dt);

    const starPos = this.stars.geometry.attributes.position;
    for (let i = 0; i < starPos.count; i++) {
      let z = starPos.getZ(i);
      z -= effectiveWorldSpeed * 0.45 * dt;
      if (z < -20) z += 130;
      starPos.setZ(i, z);
    }
    starPos.needsUpdate = true;

    if (this.gridHelper) {
      this.gridHelper.position.z -= effectiveWorldSpeed * dt;
      if (this.gridHelper.position.z <= 20) {
        this.gridHelper.position.z += 20;
      }
    }

    try {
      this.handleCollisions();
    } catch (e) {
      console.error('Collision error', e);
    }

    this.score += CONFIG.scorePerSecond * dt * (isBoosting ? 1.5 : 1);

    if (this.ui) this.ui.updateHUD(this, currentStage);

    this.render();
  }

  firePlayer() {
    const pos = this.player.group.position.clone();
    pos.z += 1.8;
    const dir = new THREE.Vector3(0, 0, 1);
    const levels = this.player.weapon;
    if (levels === 1) {
      for (const off of [-0.32, 0.32]) {
        const b = this.playerBullets.get();
        b.spawn(pos.clone().add(new THREE.Vector3(off, -0.05, 0)), dir, CONFIG.bulletSpeed);
        b.damage = 15;
      }
    } else if (levels === 2) {
      for (const off of [-0.48, 0, 0.48]) {
        const b = this.playerBullets.get();
        const d = new THREE.Vector3(off * 0.16, 0, 1).normalize();
        b.spawn(pos.clone().add(new THREE.Vector3(off, -0.05, 0)), d, CONFIG.bulletSpeed);
        b.damage = 17;
      }
    } else {
      for (const off of [-0.68, -0.24, 0.24, 0.68]) {
        const b = this.playerBullets.get();
        const d = new THREE.Vector3(off * 0.2, 0, 1).normalize();
        b.spawn(pos.clone().add(new THREE.Vector3(off, -0.05, 0)), d, CONFIG.bulletSpeed);
        b.damage = 19;
      }
    }
  }

  fireBoss(playerPos, baseSpd) {
    const bossPos = this.boss.group.position.clone();
    const spd = baseSpd * (1.08 + this.boss.enragePhase * 0.15);

    const spreadCount = this.boss.enragePhase >= 3 ? 3 : 2;
    for (let i = -spreadCount; i <= spreadCount; i++) {
      const dir = new THREE.Vector3(i * 0.25, 0, -1).normalize();
      const b = this.enemyBullets.get();
      b.spawn(bossPos.clone(), dir, spd);
      b.damage = 14 + this.boss.enragePhase * 2;
    }

    if (this.boss.enragePhase >= 2) {
      const aimedDir = new THREE.Vector3().subVectors(playerPos, bossPos).normalize();
      const b = this.enemyBullets.get();
      b.spawn(bossPos.clone(), aimedDir, spd * 1.2);
      b.damage = 16;
    }

    if (this.boss.enragePhase >= 3 && Math.random() < 0.3) {
      const drone = this.enemies.get();
      drone.spawn(bossPos.x + (Math.random() * 4 - 2), bossPos.y, bossPos.z - 1, 'kamikaze', this.levelManager.difficulty);
    }
  }

  applyGateReward(rewardType) {
    if (rewardType === 'weapon') {
      this.player.weapon = Math.min(3, this.player.weapon + 1);
      this.player.addShield(25);
    } else if (rewardType === 'shield') {
      this.player.addShield(50);
    } else if (rewardType === 'boost') {
      this.player.boostTimer = Math.min(30, this.player.boostTimer + 7);
    } else if (rewardType === 'health') {
      this.player.heal(40);
    }
  }

  handleCollisions() {
    const playerPos = this.player.group.position;

    for (const b of this.playerBullets.active()) {
      for (const e of this.enemies.active()) {
        const d = b.mesh.position.distanceTo(e.group.position);
        if (d < 0.9 + e.radius) {
          const killed = e.takeDamage(b.damage);
          b.deactivate();
          this.particles.burst(b.mesh.position, 0xffaa00, 6, 5);
          this.audio.hit();
          if (killed) {
            this.score += e.scoreValue * (this.levelManager.mode === 'arcade' ? 1.5 : 1);
            this.particles.burst(e.group.position, 0xff4d6d, 16, 7);
            this.audio.explode();
            if (this.settings.vibrate && navigator.vibrate) navigator.vibrate(25);
          }
          break;
        }
      }

      if (!b.active) continue;

      if (this.boss.active && b.mesh.position.distanceTo(this.boss.group.position) < this.boss.radius + 0.5) {
        const killed = this.boss.takeDamage(b.damage);
        b.deactivate();
        this.particles.burst(b.mesh.position, 0xc084fc, 8, 5);
        this.audio.hit();
        if (killed) {
          this.score += this.boss.scoreValue * this.levelManager.level;
          this.particles.burst(this.boss.group.position, 0x9d4edd, 36, 9);
          this.audio.explode(true);
          this.levelManager.setBossDefeated();
          if (this.levelManager.state !== 'transition') this._bossSpawned = false;
        }
        continue;
      }

      for (const o of this.obstacles.active()) {
        if (b.mesh.position.distanceTo(o.mesh.position) < 0.55 + o.radius) {
          const opos = o.mesh.position.clone();
          const destroyed = o.takeDamage(b.damage);
          b.deactivate();
          this.particles.burst(b.mesh.position, 0x94a3b8, 5, 4);
          this.audio.hit();
          if (destroyed) {
            this.score += CONFIG.scorePerObstacle;
            this.particles.burst(opos, 0x38bdf8, 12, 6);
            this.audio.explode();
          }
          break;
        }
      }
    }

    if (this.player.invuln <= 0) {
      for (const b of this.enemyBullets.active()) {
        if (b.mesh.position.distanceTo(playerPos) < 0.88) {
          b.deactivate();
          this.player.takeDamage(b.damage);
          this.particles.burst(playerPos, 0xff4d6d, 12, 5);
          this.audio.damage();
          if (this.settings.vibrate && navigator.vibrate) navigator.vibrate(50);
          if (this.player.hp <= 0) {
            this.gameOver();
            return;
          }
        }
      }
    }

    if (this.player.invuln <= 0) {
      for (const e of this.enemies.active()) {
        if (e.group.position.distanceTo(playerPos) < e.radius + 0.7) {
          e.deactivate();
          this.player.takeDamage(22);
          this.particles.burst(e.group.position, 0xff4d6d, 16, 6);
          this.audio.damage();
          this.score += 15;
          if (this.player.hp <= 0) {
            this.gameOver();
            return;
          }
        }
      }
    }

    if (this.player.invuln <= 0) {
      for (const o of this.obstacles.active()) {
        if (o.mesh.position.distanceTo(playerPos) < o.radius + 0.68) {
          const opos = o.mesh.position.clone();
          o.deactivate();
          this.player.takeDamage(o.destructible ? 16 : 30);
          this.particles.burst(opos, 0x8d99ae, 14, 6);
          this.audio.damage();
          if (this.player.hp <= 0) {
            this.gameOver();
            return;
          }
        }
      }
    }

    if (this.boss.active && this.player.invuln <= 0) {
      if (this.boss.group.position.distanceTo(playerPos) < this.boss.radius + 0.7) {
        this.player.takeDamage(28);
        this.particles.burst(playerPos, 0x9d4edd, 16, 6);
        this.audio.damage();
        if (this.player.hp <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    for (const p of this.powerups.active()) {
      if (p.mesh.position.distanceTo(playerPos) < 1.25) {
        this.applyPowerup(p.type);
        p.deactivate();
        this.audio.powerup();
        this.particles.burst(playerPos, 0x00f5d4, 14, 5);
      }
    }
  }

  applyPowerup(type) {
    switch (type) {
      case 'shield':
        this.player.addShield(45);
        break;
      case 'health':
        this.player.heal(35);
        break;
      case 'double':
        this.player.weapon = Math.min(3, this.player.weapon + 1);
        break;
      case 'triple':
        this.player.weapon = 3;
        break;
      case 'boost':
        this.player.boostTimer = Math.min(30, this.player.boostTimer + 6);
        break;
    }
    if (this.ui) this.ui.toast(`⚡ POWER-UP: ${type.toUpperCase()}`);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
